import { Controller, useWatch, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Autocomplete, MenuItem, TextField } from '@mui/material'
import { scopeLabels, type AccessScope } from '../../../shared/api'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import { useAuthStore, scopeAllowed } from '../../../entities/user'

const scopes = Object.keys(scopeLabels) as AccessScope[]

interface ScopeValues {
  accessScope: AccessScope
  institutionIds: string[]
}

interface Props<T extends FieldValues & ScopeValues> {
  control: Control<T>
  assignedIds?: string[]
}

export const InstitutionScopeFields = <T extends FieldValues & ScopeValues>({ control, assignedIds = [] }: Props<T>) => {
  const profile = useAuthStore((s) => s.profile)
  const institutions = useInstitutionStore((s) => s.institutions)
  const scope = useWatch({ control, name: 'accessScope' as Path<T> })
  const limited = profile?.role !== 'root' && profile?.accessScope === 'institutions'
  const options = institutions.filter(
    (institution) =>
      (institution.isActive || assignedIds.includes(institution.id)) &&
      (!limited || profile.institutionIds.includes(institution.id)),
  )

  return (
    <>
      <Controller
        name={'accessScope' as Path<T>}
        control={control}
        render={({ field }) => (
          <TextField {...field} select label="Доступ до закладів" fullWidth>
            {scopes.map((value) => (
              <MenuItem key={value} value={value} disabled={!scopeAllowed(profile, value)}>
                {scopeLabels[value]}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {scope === 'institutions' && (
        <Controller
          name={'institutionIds' as Path<T>}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={options}
              value={options.filter((institution) => (field.value as string[]).includes(institution.id))}
              getOptionLabel={(institution) => institution.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              noOptionsText="Немає закладів"
              onChange={(_, value) => field.onChange(value.map((institution) => institution.id))}
              onBlur={field.onBlur}
              renderInput={(params) => (
                <TextField {...params} label="Заклади" error={!!error} helperText={error?.message} />
              )}
            />
          )}
        />
      )}
    </>
  )
}
