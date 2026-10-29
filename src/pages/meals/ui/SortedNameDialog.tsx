import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
  sortOrder: yup.number().typeError('Вкажіть число').integer('Ціле число').min(0, 'Не менше 0').required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

interface Props {
  open: boolean
  title: string
  initial: { name: string; sortOrder: number }
  isSaving: boolean
  onClose: () => void
  onSubmit: (values: { name: string; sortOrder: number }) => Promise<void>
}

export const SortedNameDialog = ({ open, title, initial, isSaving, onClose, onSubmit }: Props) => {
  const isPhone = useIsPhone()
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: initial,
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (open) reset(initial)
  }, [open, initial, reset])

  const submit = async (values: FormValues) => {
    await onSubmit({ name: values.name.trim(), sortOrder: values.sortOrder })
    onClose()
  }

  return (
    <Dialog fullScreen={isPhone} open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" autoFocus error={!!error} helperText={error?.message} />
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
