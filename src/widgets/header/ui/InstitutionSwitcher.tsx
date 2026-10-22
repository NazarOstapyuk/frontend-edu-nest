import { MenuItem, Select, Typography } from '@mui/material'
import { useInstitutionStore } from '../../../shared/model/institutionStore'

const ALL = 'all'

export const InstitutionSwitcher = () => {
  const institutions = useInstitutionStore((s) => s.institutions)
  const selectedId = useInstitutionStore((s) => s.selectedId)
  const select = useInstitutionStore((s) => s.select)

  if (institutions.length === 0) return null

  if (institutions.length === 1) {
    return (
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {institutions[0].name}
      </Typography>
    )
  }

  return (
    <Select
      size="small"
      value={selectedId ?? ALL}
      onChange={(e) => select(e.target.value === ALL ? null : e.target.value)}
      sx={{ minWidth: 200 }}
    >
      <MenuItem value={ALL}>Усі заклади</MenuItem>
      {institutions.map((institution) => (
        <MenuItem key={institution.id} value={institution.id}>
          {institution.isActive ? institution.name : `${institution.name} (неактивний)`}
        </MenuItem>
      ))}
    </Select>
  )
}
