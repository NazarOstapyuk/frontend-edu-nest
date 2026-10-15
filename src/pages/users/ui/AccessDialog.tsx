import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  ALL_AREAS,
  accessTemplates,
  areaLabels,
  levelLabels,
  levelSatisfies,
  scopeLabels,
  usersApi,
  type AccessScope,
  type PermissionArea,
  type PermissionLevel,
  type PermissionMap,
} from '../../../shared/api'
import { useAuthStore, type SessionRole, type User } from '../../../entities/user'

interface Props {
  user: User
  onClose: () => void
  onSaved: (user: User) => void
}

const scopes = Object.keys(scopeLabels) as AccessScope[]

const toMap = (user: User): PermissionMap =>
  Object.fromEntries((user.permissions ?? []).map((p) => [p.area, p.level]))

export const AccessDialog = ({ user, onClose, onSaved }: Props) => {
  const profile = useAuthStore((s) => s.profile)
  const [scope, setScope] = useState<AccessScope>(user.accessScope ?? 'all')
  const [permissions, setPermissions] = useState<PermissionMap>(toMap(user))
  const [saving, setSaving] = useState(false)
  const isRoot = profile?.role === 'root'
  const readOnly = !profile || profile.id === user.id || (user.role as SessionRole) === 'root'
  const allowed = (level: PermissionLevel, area: PermissionArea) =>
    isRoot || levelSatisfies(profile?.permissions?.[area], level)
  const scopeAllowed = (value: AccessScope) =>
    isRoot || profile?.accessScope === 'all' || profile?.accessScope === value

  const applyTemplate = (name: string) => {
    const template = accessTemplates.find((t) => t.name === name)
    if (!template) return
    setScope(template.accessScope)
    setPermissions(template.permissions)
  }

  const setLevel = (area: PermissionArea, value: PermissionLevel | 'none') => {
    setPermissions((current) => {
      const next = { ...current }
      if (value === 'none') delete next[area]
      else next[area] = value
      return next
    })
  }

  const save = () => {
    setSaving(true)
    usersApi
      .setAccess(user.id, {
        accessScope: scope,
        permissions: ALL_AREAS.flatMap((area) => {
          const level = permissions[area]
          return level ? [{ area, level }] : []
        }),
      })
      .then(({ data }) => {
        onSaved(data)
        onClose()
      })
      .catch(() => undefined)
      .finally(() => setSaving(false))
  }

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>
        Доступ: {user.lastName} {user.firstName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {readOnly && (
            <Typography variant="body2" color="text.secondary">
              Цей доступ не можна змінити тут.
            </Typography>
          )}
          <TextField
            select
            label="Шаблон посади"
            value=""
            disabled={readOnly}
            onChange={(event) => applyTemplate(event.target.value)}
          >
            {accessTemplates.map((template) => (
              <MenuItem key={template.name} value={template.name}>
                {template.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Обмеження"
            value={scope}
            disabled={readOnly}
            onChange={(event) => setScope(event.target.value as AccessScope)}
          >
            {scopes.map((value) => (
              <MenuItem key={value} value={value} disabled={!scopeAllowed(value)}>
                {scopeLabels[value]}
              </MenuItem>
            ))}
          </TextField>
          <Table size="small">
            <TableBody>
              {ALL_AREAS.map((area) => (
                <TableRow key={area}>
                  <TableCell>{areaLabels[area]}</TableCell>
                  <TableCell align="right">
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      disabled={readOnly}
                      value={permissions[area] ?? 'none'}
                      onChange={(_, value: PermissionLevel | 'none' | null) => {
                        if (value) setLevel(area, value)
                      }}
                    >
                      <ToggleButton value="none" disabled={!allowed('view', area) && !!permissions[area]}>
                        Немає
                      </ToggleButton>
                      <ToggleButton value="view" disabled={!allowed('view', area)}>
                        {levelLabels.view}
                      </ToggleButton>
                      <ToggleButton value="edit" disabled={!allowed('edit', area)}>
                        {levelLabels.edit}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={readOnly || saving} onClick={save}>
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  )
}
