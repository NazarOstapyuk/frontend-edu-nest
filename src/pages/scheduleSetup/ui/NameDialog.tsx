import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
})

type FormValues = yup.InferType<typeof schema>

interface NameDialogProps {
  open: boolean
  title: string
  initial: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

export const NameDialog = ({ open, title, initial, isSaving, onClose, onSubmit }: NameDialogProps) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: initial },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (open) reset({ name: initial })
  }, [open, initial, reset])

  const submit = async (values: FormValues) => {
    await onSubmit(values.name.trim())
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" autoFocus error={!!error} helperText={error?.message} />
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
