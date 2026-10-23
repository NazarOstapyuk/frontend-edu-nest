import { Box, Typography } from '@mui/material'
import type { DayDishRow } from '../model/dayDishes'

export const DayDishList = ({ rows }: { rows: DayDishRow[] }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
    {rows.map((row) => (
      <Box key={row.key}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.3 }}
        >
          {row.title}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.35 }}>
          {row.names.join(' / ')}
        </Typography>
      </Box>
    ))}
  </Box>
)
