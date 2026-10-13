import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import type { MenuTemplate } from '../../../shared/api'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
  weeks: yup.number().typeError('Вкажіть число').integer('Ціле число').min(1, 'Від 1 до 8').max(8, 'Від 1 до 8').required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

export const TemplateDialog = ({ template, open, onClose }: { template: MenuTemplate | null; open: boolean; onClose: () => void }) => {
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveTemplate = useMealsStore((s) => s.saveTemplate)
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', weeks: 4 },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (open) reset({ name: template?.name ?? '', weeks: template?.weeks ?? 4 })
  }, [open, template, reset])

  const submit = async (values: FormValues) => {
    await saveTemplate(template?.id ?? null, { name: values.name.trim(), weeks: values.weeks })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{template ? 'Шаблон' : 'Новий шаблон'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller name="name" control={control} render={({ field, fieldState: { error } }) => (
          <TextField {...field} label="Назва" error={!!error} helperText={error?.message} />
        )} />
        <Controller name="weeks" control={control} render={({ field, fieldState: { error } }) => (
          <TextField {...field} type="number" label="Тижнів у циклі" error={!!error} helperText={error?.message} />
        )} />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit((v) => submit(v).catch(() => undefined))} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Зберегти</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
