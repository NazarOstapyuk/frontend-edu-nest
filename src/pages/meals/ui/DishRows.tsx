import { Box, Typography } from '@mui/material'
import type { DayDishRow } from '../model/dayDishes'
import { courseColorAt } from '../model/courseColors'
import { useMealsStore } from '../model/mealsStore'

export const DishRows = ({ rows, compact = false }: { rows: DayDishRow[]; compact?: boolean }) => {
  const courses = useMealsStore((st) => st.courses)
  const order = [...courses].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk')).map((c) => c.id)
  const courseColor = (id: string) => courseColorAt(Math.max(0, order.indexOf(id)))

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {rows.map((row) => (
          <Box key={row.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: courseColor(row.key).dot }} />
            <Typography
              variant="body2"
              title={`${row.title}: ${row.names.join(' або ')}`}
              sx={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {row.names.join(' або ')}
            </Typography>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((row, index) => {
        const color = courseColor(row.key)
        return (
          <Box
            key={row.key}
            sx={{ py: 0.9, borderTop: index ? '1px solid' : 0, borderColor: 'divider' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: color.dot }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: color.text, lineHeight: 1.2 }}>
                {row.title}
              </Typography>
              {row.names.length > 1 && (
                <Typography sx={{ fontSize: 11, color: 'text.secondary', ml: 'auto', lineHeight: 1.2 }}>на вибір</Typography>
              )}
            </Box>
            {row.names.map((name, i) => (
              <Box key={`${name}-${i}`} sx={{ display: 'flex', gap: 0.75, pl: 2 }}>
                {row.names.length > 1 && (
                  <Typography sx={{ fontSize: 12, color: 'text.disabled', lineHeight: 1.4, minWidth: 8 }}>•</Typography>
                )}
                <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: 'text.primary', lineHeight: 1.4 }}>{name}</Typography>
              </Box>
            ))}
          </Box>
        )
      })}
    </Box>
  )
}
