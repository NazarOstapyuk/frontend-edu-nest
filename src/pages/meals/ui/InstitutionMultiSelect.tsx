import { Checkbox, ListItemText, MenuItem, TextField } from '@mui/material'
import { useEffectiveInstitutions } from '../../../shared/model/institutionStore'

export const InstitutionMultiSelect = ({ label, value, onChange, currentId, lockCurrent }: {
  label: string
  value: string[]
  onChange: (ids: string[]) => void
  currentId: string
  lockCurrent?: boolean
}) => {
  const institutions = useEffectiveInstitutions()
  const options = institutions.filter((i) => i.isActive || i.id === currentId)
  const names = (ids: string[]) => ids.map((id) => institutions.find((i) => i.id === id)?.name ?? id).join(', ')

  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => {
        const next = e.target.value as unknown as string[]
        onChange(lockCurrent && !next.includes(currentId) ? [currentId, ...next] : next)
      }}
      slotProps={{ select: { multiple: true, renderValue: (v) => names(v as string[]) } }}
    >
      {options.map((i) => (
        <MenuItem key={i.id} value={i.id} disabled={lockCurrent && i.id === currentId}>
          <Checkbox checked={value.includes(i.id)} />
          <ListItemText primary={i.name} />
        </MenuItem>
      ))}
    </TextField>
  )
}
