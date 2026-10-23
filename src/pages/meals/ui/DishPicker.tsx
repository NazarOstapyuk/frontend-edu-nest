import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import type { Dish } from '../../../shared/api'

export const DishPicker = ({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) => {
  const courses = useMealsStore((s) => s.courses)
  const dishes = useMealsStore((s) => s.dishes)
  const visible = dishes
    .filter((d) => d.active || value.includes(d.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'))

  if (visible.length === 0) return <Typography color="text.secondary">Спочатку додайте страви в «Довідниках».</Typography>

  const setCourse = (courseId: string, picked: Dish[]) => {
    const others = value.filter((id) => visible.find((d) => d.id === id)?.courseId !== courseId)
    onChange([...others, ...picked.map((d) => d.id)])
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {courses.map((course) => {
        const options = visible.filter((d) => d.courseId === course.id)
        if (options.length === 0) return null
        const selected = options.filter((d) => value.includes(d.id))
        return (
          <Autocomplete
            key={course.id}
            multiple
            disableCloseOnSelect
            size="small"
            options={options}
            value={selected}
            onChange={(_, picked) => setCourse(course.id, picked)}
            getOptionLabel={(d) => (d.active ? d.name : `${d.name} (вимкнено)`)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Нічого не знайдено"
            renderInput={(params) => (
              <TextField
                {...params}
                label={course.name}
                placeholder={selected.length ? '' : 'Пошук страви'}
                helperText={selected.length > 1 ? 'Кілька страв: батьки виберуть одну' : undefined}
              />
            )}
          />
        )
      })}
    </Box>
  )
}
