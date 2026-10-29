import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useIsPhone } from '../lib/useIsPhone'
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'

const schema = yup.object({
  reason: yup.string().trim().required('Вкажіть причину').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

interface ReasonDialogProps {
  open: boolean
  title: string
  subtitle?: string
  confirmLabel?: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}

export const ReasonDialog = ({
  open,
  title,
  subtitle,
  confirmLabel = 'Підтвердити',
  isSaving,
  onClose,
  onSubmit,
}: ReasonDialogProps) => {
  const isPhone = useIsPhone()
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { reason: '' },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const submit = async (values: FormValues) => {
    await onSubmit(values.reason.trim())
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        <Controller
          name="reason"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Причина"
              fullWidth
              multiline
              minRows={2}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(submit)}
            variant="contained"
            color="error"
            disabled={isSaving}
            sx={{ width: '100%' }}
          >
            {confirmLabel}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
