import { Box, Typography } from '@mui/material'
import type { DayDishRow } from '../model/dayDishes'
import { courseColorFor } from '../model/courseColors'
import { useMealsStore } from '../model/mealsStore'

export const DishRows = ({ rows }: { rows: DayDishRow[] }) => {
  const courses = useMealsStore((st) => st.courses)
  const courseColor = (id: string) => courseColorFor(courses, id)

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
