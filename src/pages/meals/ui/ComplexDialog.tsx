import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Autocomplete, Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import type { MealComplex } from '../../../shared/api'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
  description: yup.string().max(500, 'Максимум 500 символів').default(''),
  sortOrder: yup.number().typeError('Вкажіть число').integer('Ціле число').min(0, 'Не менше 0').required("Обов'язкове поле"),
  courseIds: yup.array().of(yup.string().required()).min(1, 'Оберіть хоча б один тип страви').required(),
})

type FormValues = yup.InferType<typeof schema>

export const ComplexDialog = ({ complex, open, onClose }: { complex: MealComplex | null; open: boolean; onClose: () => void }) => {
  const courses = useMealsStore((s) => s.courses)
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveComplex = useMealsStore((s) => s.saveComplex)
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', description: '', sortOrder: 0, courseIds: [] },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (open)
      reset({
        name: complex?.name ?? '',
        description: complex?.description ?? '',
        sortOrder: complex?.sortOrder ?? 0,
        courseIds: complex?.courses.map((c) => c.id) ?? [],
      })
  }, [open, complex, reset])

  const submit = async (values: FormValues) => {
    const description = values.description.trim()
    await saveComplex(complex?.id ?? null, {
      name: values.name.trim(),
      description: complex ? description || null : description || undefined,
      sortOrder: values.sortOrder,
      courseIds: values.courseIds,
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{complex ? 'Комплекс' : 'Новий комплекс'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="courseIds"
          control={control}
          render={({ field, fieldState: { error } }) => {
            const selected = field.value ?? []
            return (
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={courses.filter((c) => c.active || selected.includes(c.id))}
                getOptionLabel={(c) => c.name}
                value={courses.filter((c) => selected.includes(c.id))}
                onChange={(_, list) => field.onChange(list.map((c) => c.id))}
                renderInput={(params) => (
                  <TextField {...params} label="Типи страв у комплексі" error={!!error} helperText={error?.message} />
                )}
              />
            )
          }}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Опис" multiline minRows={2} error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="sortOrder"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} type="number" label="Порядок" error={!!error} helperText={error?.message} />
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
