import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import type { Dish } from '../../../shared/api'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(150, 'Максимум 150 символів'),
  courseId: yup.string().required("Обов'язкове поле"),
  description: yup.string().max(500, 'Максимум 500 символів').default(''),
})

type FormValues = yup.InferType<typeof schema>

export const DishDialog = ({ dish, open, onClose }: { dish: Dish | null; open: boolean; onClose: () => void }) => {
  const courses = useMealsStore((s) => s.courses)
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveDish = useMealsStore((s) => s.saveDish)
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', courseId: '', description: '' },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (open) reset({ name: dish?.name ?? '', courseId: dish?.courseId ?? '', description: dish?.description ?? '' })
  }, [open, dish, reset])

  const submit = async (values: FormValues) => {
    const description = values.description.trim()
    await saveDish(
      dish?.id ?? null,
      dish
        ? { name: values.name.trim(), description: description || null }
        : { name: values.name.trim(), courseId: values.courseId, description: description || undefined },
    )
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{dish ? 'Страва' : 'Нова страва'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="courseId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Тип страви" disabled={!!dish} error={!!error} helperText={error?.message}>
              {courses
                .filter((c) => c.active || c.id === field.value)
                .map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Опис / склад" multiline minRows={2} error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit((v) => submit(v).catch(() => undefined))} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
