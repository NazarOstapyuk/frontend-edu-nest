import { Chip } from '@mui/material'
import { chargeStateLabels, type ChargeState } from '../api'
import { brandColors } from '../assets/brand'

const stateColors: Record<ChargeState, { bg: string; color: string }> = {
  paid: { bg: brandColors.paidBg, color: brandColors.paidText },
  partial: { bg: brandColors.partialBg, color: brandColors.partialText },
  unpaid: { bg: brandColors.unpaidBg, color: brandColors.unpaidText },
}

export const ChargeStateChip = ({ state }: { state: ChargeState }) => (
  <Chip
    size="small"
    label={chargeStateLabels[state]}
    sx={{ bgcolor: stateColors[state].bg, color: stateColors[state].color }}
  />
)
