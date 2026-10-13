import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'

export const DishPicker = ({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) => {
  const courses = useMealsStore((s) => s.courses)
  const dishes = useMealsStore((s) => s.dishes)
  const visible = dishes.filter((d) => d.active || value.includes(d.id))
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  if (visible.length === 0) return <Typography color="text.secondary">Спочатку додайте страви в «Довідниках».</Typography>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {courses.map((course) => {
        const list = visible.filter((d) => d.courseId === course.id)
        if (list.length === 0) return null
        return (
          <Box key={course.id}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{course.name}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {list.map((d) => (
                <FormControlLabel
                  key={d.id}
                  control={<Checkbox size="small" checked={value.includes(d.id)} onChange={() => toggle(d.id)} />}
                  label={d.active ? d.name : `${d.name} (вимкнено)`}
                />
              ))}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
