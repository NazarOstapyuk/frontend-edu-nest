import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'
import { useSubscriptionsStore } from '../model/subscriptionsStore'

const schema = yup.object({
  totalSessions: yup
    .number()
    .typeError('Введіть число')
    .integer('Має бути цілим числом')
    .positive('Має бути більше 0')
    .required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

export const EditSubscriptionModal = () => {
  const updateSubscription = useSubscriptionsStore((s) => s.updateSubscription)
  const isUpdating = useSubscriptionsStore((s) => s.isUpdating)
  const { isOpen, subscription } = useSubscriptionsStore((s) => s.editModal)
  const setEditModal = useSubscriptionsStore((s) => s.setEditModal)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { totalSessions: undefined },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (subscription) {
      reset({ totalSessions: subscription.totalSessions })
    }
  }, [subscription, reset])

  const handleClose = () => {
    reset()
    setEditModal({ isOpen: false, subscription: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!subscription) return
    await updateSubscription(subscription.id, values.totalSessions)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Редагувати абонемент</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        {subscription && (
          <Typography variant="body2" color="text.secondary">
            {subscription.child.lastName} {subscription.child.firstName} —{' '}
            {subscription.subscriptionType.name}
          </Typography>
        )}

        <Controller
          name="totalSessions"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              label="Кількість занять"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
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
            disabled={isUpdating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
