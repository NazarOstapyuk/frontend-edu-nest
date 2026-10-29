import { useEffect, useState } from 'react'
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
  Typography,
} from '@mui/material'
import { areaLabels, levelLabels, scopeLabels, usersApi, type AccessScope } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import { useAuthStore, type User } from '../../../entities/user'
import { canAssignPosition, usePositionsStore } from '../../../entities/position'
import { canChangeAccess, scopeAllowed as scopeAllowedFor } from '../../../entities/user'

interface Props {
  user: User
  onClose: () => void
  onSaved: (user: User) => void
}

const scopes = Object.keys(scopeLabels) as AccessScope[]

const institutionsSchema = yup.array(yup.string().required()).min(1, 'Оберіть хоча б один заклад')

export const AccessDialog = ({ user, onClose, onSaved }: Props) => {
  const isPhone = useIsPhone()
  const profile = useAuthStore((s) => s.profile)
  const positions = usePositionsStore((s) => s.positions)
  const loadPositions = usePositionsStore((s) => s.load)
  const [positionId, setPositionId] = useState(user.position?.id ?? '')
  const [positionError, setPositionError] = useState<string | null>(null)
  const [scope, setScope] = useState<AccessScope>(user.accessScope ?? 'all')
  const institutions = useInstitutionStore((s) => s.institutions)
  const [institutionIds, setInstitutionIds] = useState<string[]>(user.institutionIds ?? [])
  const [institutionsError, setInstitutionsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const scopeAllowed = (value: AccessScope) => scopeAllowedFor(profile, value)
  const readOnly = !canChangeAccess(profile, user)
  const chosen = positions.find((p) => p.id === positionId)

  useEffect(() => {
    loadPositions().catch(() => undefined)
  }, [loadPositions])

  const options = institutions.filter(
    (institution) => institution.isActive || (user.institutionIds ?? []).includes(institution.id),
  )

  const save = () => {
    if (!positionId) {
      setPositionError('Оберіть посаду')
      return
    }
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
        positionId,
        accessScope: scope,
        ...(scope === 'institutions' ? { institutionIds } : {}),
      })
      .then(({ data }) => {
        onSaved(data)
        onClose()
      })
      .catch(() => undefined)
      .finally(() => setSaving(false))
  }

  return (
    <Dialog open fullScreen={isPhone} fullWidth maxWidth="sm" onClose={onClose}>
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
            label="Посада"
            value={positionId}
            disabled={readOnly}
            error={!!positionError}
            helperText={positionError}
            onChange={(event) => {
              setPositionId(event.target.value)
              setPositionError(null)
            }}
          >
            {positions.map((p) => (
              <MenuItem key={p.id} value={p.id} disabled={!canAssignPosition(profile, p)}>
                {p.name}
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
          {chosen && (
            <Table size="small">
              <TableBody>
                {chosen.permissions.length === 0 ? (
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary' }}>Посада без доступу до розділів</TableCell>
                  </TableRow>
                ) : (
                  chosen.permissions.map((permission) => (
                    <TableRow key={permission.area}>
                      <TableCell>{areaLabels[permission.area]}</TableCell>
                      <TableCell align="right">{levelLabels[permission.level]}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
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
