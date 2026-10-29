import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'
import { useChildFinanceStore, type VoidTarget } from '../model/childFinanceStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const titles: Record<VoidTarget['kind'], string> = {
  charge: 'Сторнувати нарахування',
  payment: 'Сторнувати оплату',
  allocation: 'Зняти розподіл',
}

const schema = yup.object({
  reason: yup.string().trim().required('Вкажіть причину').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

export const VoidModal = () => {
  const isPhone = useIsPhone()
  const { isOpen, target } = useChildFinanceStore((s) => s.voidModal)
  const setVoidModal = useChildFinanceStore((s) => s.setVoidModal)
  const voidRecord = useChildFinanceStore((s) => s.voidRecord)
  const isSaving = useChildFinanceStore((s) => s.isSaving)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { reason: '' },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    setVoidModal({ isOpen: false, target: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!target) return
    await voidRecord(target, values.reason.trim())
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{target ? titles[target.kind] : ''}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Typography variant="body2" color="text.secondary">
          {target?.title}. Запис залишиться в історії, але не враховуватиметься в сумах.
        </Typography>
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
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            color="error"
            disabled={isSaving}
            sx={{ width: '100%' }}
          >
            Підтвердити
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
