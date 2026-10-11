import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'
import { usePackagesStore } from '../model/packagesStore'
import { formatDay } from '../../../shared/api'

const schema = yup.object({
  newExpiresAt: yup.string().required("Обов'язкове поле"),
  reason: yup.string().trim().required('Вкажіть причину').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

export const ExtendPackageModal = () => {
  const target = usePackagesStore((s) => s.extendTarget)
  const setTarget = usePackagesStore((s) => s.setExtendTarget)
  const extend = usePackagesStore((s) => s.extend)
  const isSaving = usePackagesStore((s) => s.isSaving)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { newExpiresAt: '', reason: '' },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset({ newExpiresAt: '', reason: '' })
    setTarget(null)
  }

  const onSubmit = async (values: FormValues) => {
    if (!target) return
    await extend(target.id, values.newExpiresAt, values.reason.trim())
    handleClose()
  }

  return (
    <Dialog open={target !== null} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Продовжити пакет</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Typography variant="body2" color="text.secondary">
          {target?.direction.name}. Поточний термін: {target?.expiresAt ? formatDay(target.expiresAt) : 'без терміну'}
        </Typography>
        <Controller
          name="newExpiresAt"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Новий термін"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Controller
          name="reason"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Причина" fullWidth multiline error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
