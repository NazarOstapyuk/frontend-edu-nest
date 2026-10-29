import { Chip, Tooltip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import type { ComplexAvailability } from '../model/menuDay'

export const ComplexChips = ({ items }: { items: ComplexAvailability[] }) => {
  const isPhone = useIsPhone()
  return (
  <>
    {items.map((c) =>
      c.missing.length === 0 ? (
        <Chip key={c.id} size="small" variant="outlined" icon={<CheckIcon />} label={c.name} sx={{ bgcolor: 'background.paper' }} />
      ) : isPhone ? (
        <Chip key={c.id} size="small" variant="outlined" color="warning" icon={<ErrorOutlineIcon />} label={`${c.name}: немає ${c.missing.join(', ')}`} sx={{ bgcolor: 'background.paper', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal' } }} />
      ) : (
        <Tooltip key={c.id} title={`Не можна замовити: немає ${c.missing.join(', ')}`}>
          <Chip size="small" variant="outlined" color="warning" icon={<ErrorOutlineIcon />} label={c.name} sx={{ bgcolor: 'background.paper' }} />
        </Tooltip>
      ),
    )}
  </>
  )
}
