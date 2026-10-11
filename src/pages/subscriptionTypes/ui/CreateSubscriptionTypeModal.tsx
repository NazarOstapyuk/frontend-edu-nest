import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { useSubscriptionTypesStore } from '../model/subscriptionTypesStore'

const schema = yup.object({
  name: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  pricePerSession: yup
    .number()
    .typeError('Введіть число')
    .positive('Має бути більше 0')
    .test('max-decimals', 'Максимум 2 знаки після коми', (val) =>
      val === undefined ? true : /^\d+(\.\d{1,2})?$/.test(String(val))
    )
    .required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

export const CreateSubscriptionTypeModal = () => {
  const createSubscriptionType = useSubscriptionTypesStore((s) => s.createSubscriptionType)
  const isCreating = useSubscriptionTypesStore((s) => s.isCreating)
  const { isOpen } = useSubscriptionTypesStore((s) => s.createModal)
  const setCreateModal = useSubscriptionTypesStore((s) => s.setCreateModal)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', pricePerSession: undefined },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    setCreateModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createSubscriptionType({ name: values.name, pricePerSession: values.pricePerSession })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий тип абонементу</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Назва"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="pricePerSession"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              label="Ціна за заняття (грн)"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
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
            disabled={isCreating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
