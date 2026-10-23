import { useState } from 'react'
import * as yup from 'yup'
import {
  Autocomplete,
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
  type AccessTemplate,
  type PermissionArea,
  type PermissionLevel,
  type PermissionMap,
} from '../../../shared/api'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import { useAuthStore, type SessionRole, type User } from '../../../entities/user'

interface Props {
  user: User
  onClose: () => void
  onSaved: (user: User) => void
}

const scopes = Object.keys(scopeLabels) as AccessScope[]

const institutionsSchema = yup.array(yup.string().required()).min(1, 'Оберіть хоча б один заклад')

const toMap = (user: User): PermissionMap =>
  Object.fromEntries((user.permissions ?? []).map((p) => [p.area, p.level]))

export const AccessDialog = ({ user, onClose, onSaved }: Props) => {
  const profile = useAuthStore((s) => s.profile)
  const [scope, setScope] = useState<AccessScope>(user.accessScope ?? 'all')
  const institutions = useInstitutionStore((s) => s.institutions)
  const [institutionIds, setInstitutionIds] = useState<string[]>(user.institutionIds ?? [])
  const [institutionsError, setInstitutionsError] = useState<string | null>(null)
  const [original] = useState<PermissionMap>(() => toMap(user))
  const [permissions, setPermissions] = useState<PermissionMap>(original)
  const [saving, setSaving] = useState(false)
  const isRoot = profile?.role === 'root'
  const allowed = (level: PermissionLevel, area: PermissionArea) =>
    isRoot || levelSatisfies(profile?.permissions?.[area], level)
  const scopeAllowed = (value: AccessScope) =>
    isRoot || profile?.accessScope === 'all' || value === 'institutions'
  const covers =
    isRoot ||
    ((profile?.accessScope === 'all' ||
      ((user.accessScope ?? 'all') === 'institutions' &&
        (user.institutionIds ?? []).every((id) => profile?.institutionIds.includes(id)))) &&
      ALL_AREAS.every((area) => {
        const have = original[area]
        return have === undefined || levelSatisfies(profile?.permissions?.[area], have)
      }))
  const readOnly =
    !profile || profile.id === user.id || (user.role as SessionRole) === 'root' || !covers
  const locked = (area: PermissionArea) => {
    const have = original[area]
    return !isRoot && have !== undefined && !levelSatisfies(profile?.permissions?.[area], have)
  }
  const templateAllowed = (template: AccessTemplate) =>
    isRoot ||
    (scopeAllowed(template.accessScope) &&
      ALL_AREAS.every((area) => {
        const level = template.permissions[area]
        return locked(area) || level === undefined || allowed(level, area)
      }))

  const applyTemplate = (name: string) => {
    const template = accessTemplates.find((t) => t.name === name)
    if (!template) return
    setScope(template.accessScope)
    setInstitutionIds(template.institutionIds)
    setInstitutionsError(null)
    setPermissions(
      Object.fromEntries(
        ALL_AREAS.flatMap((area) => {
          const level = locked(area) ? original[area] : template.permissions[area]
          return level ? [[area, level]] : []
        }),
      ),
    )
  }

  const setLevel = (area: PermissionArea, value: PermissionLevel | 'none') => {
    setPermissions((current) => {
      const next = { ...current }
      if (value === 'none') delete next[area]
      else next[area] = value
      return next
    })
  }

  const options = institutions.filter(
    (institution) => institution.isActive || (user.institutionIds ?? []).includes(institution.id),
  )

  const save = () => {
    if (scope === 'institutions') {
      try {
        institutionsSchema.validateSync(institutionIds)
      } catch (error) {
        setInstitutionsError(error instanceof yup.ValidationError ? error.message : 'Оберіть хоча б один заклад')
        return
      }
    }
    setSaving(true)
    usersApi
      .setAccess(user.id, {
        accessScope: scope,
        ...(scope === 'institutions' ? { institutionIds } : {}),
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
              <MenuItem key={template.name} value={template.name} disabled={!templateAllowed(template)}>
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
          {scope === 'institutions' && (
            <Autocomplete
              multiple
              disableCloseOnSelect
              disabled={readOnly}
              options={options}
              value={options.filter((institution) => institutionIds.includes(institution.id))}
              getOptionLabel={(institution) => institution.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              noOptionsText="Немає закладів"
              onChange={(_, value) => {
                setInstitutionIds(value.map((institution) => institution.id))
                setInstitutionsError(null)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Заклади"
                  error={!!institutionsError}
                  helperText={institutionsError}
                />
              )}
            />
          )}
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
                      <ToggleButton value="none" disabled={locked(area) && !!permissions[area]}>
                        Немає
                      </ToggleButton>
                      <ToggleButton value="view" disabled={!allowed('view', area) || (locked(area) && permissions[area] !== 'view')}>
                        {levelLabels.view}
                      </ToggleButton>
                      <ToggleButton value="edit" disabled={!allowed('edit', area) || (locked(area) && permissions[area] !== 'edit')}>
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
