import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Autocomplete, Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { useSubscriptionsStore } from '../model/subscriptionsStore'
import { useChildrenStore } from '../../children/model/childrenStore'
import { useSubscriptionTypesStore } from '../../subscriptionTypes/model/subscriptionTypesStore'

const schema = yup.object({
  childIds: yup.array().of(yup.string().required()).min(1, 'Оберіть хоча б одного учня').required(),
  subscriptionTypeId: yup.string().required("Обов'язкове поле"),
  totalSessions: yup
    .number()
    .typeError('Введіть число')
    .integer('Має бути цілим числом')
    .positive('Має бути більше 0')
    .required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

export const CreateSubscriptionModal = () => {
  const createSubscription = useSubscriptionsStore((s) => s.createSubscription)
  const isCreating = useSubscriptionsStore((s) => s.isCreating)
  const { isOpen } = useSubscriptionsStore((s) => s.createModal)
  const setCreateModal = useSubscriptionsStore((s) => s.setCreateModal)

  const children = useChildrenStore((s) => s.children)
  const subscriptionTypes = useSubscriptionTypesStore((s) => s.subscriptionTypes)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { childIds: [], subscriptionTypeId: '', totalSessions: undefined },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    setCreateModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createSubscription({
      childId: values.childId,
      subscriptionTypeId: values.subscriptionTypeId,
      totalSessions: values.totalSessions,
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий абонемент</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="childId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              options={children}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
              value={children.find((c) => c.id === field.value) ?? null}
              onChange={(_, selected) => field.onChange(selected?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Учень"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}
        />

        <Controller
          name="subscriptionTypeId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              options={subscriptionTypes}
              getOptionLabel={(option) =>
                `${option.name} — ${option.pricePerSession.toLocaleString('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0, maximumFractionDigits: 2 })} / заняття`
              }
              value={subscriptionTypes.find((t) => t.id === field.value) ?? null}
              onChange={(_, selected) => field.onChange(selected?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Тип абонементу"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}
        />

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
