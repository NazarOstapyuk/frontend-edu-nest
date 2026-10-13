import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'
import {
  localToday,
  normalizeAmount,
  payrollApi,
  payrollPaymentMethodLabels,
  toKopecks,
  type PayrollPaymentMethod,
} from '../../../shared/api'
import { usePayrollStore } from '../model/payrollStore'

const methods = Object.keys(payrollPaymentMethodLabels) as PayrollPaymentMethod[]

const schema = yup.object({
  date: yup
    .string()
    .required('Вкажіть дату')
    .test('not-future', 'Дата ще не настала', (value) => !value || value <= localToday()),
  amount: yup
    .string()
    .trim()
    .required('Вкажіть суму')
    .matches(/^\d{1,8}([.,]\d{1,2})?$/, 'Неправильна сума')
    .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0),
  method: yup.mixed<PayrollPaymentMethod>().oneOf(methods).required(),
  comment: yup.string().trim().max(500, 'Не більше 500 символів').default(''),
})

type FormValues = yup.InferType<typeof schema>

export const PaymentDialog = ({ onClose }: { onClose: () => void }) => {
  const runDetail = usePayrollStore((s) => s.runDetail)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const { control, handleSubmit } = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: { date: localToday(), amount: '', method: 'cash', comment: '' },
  })

  const onSubmit = (values: FormValues) => {
    runDetail((teacherId, month) =>
      payrollApi.addPayment(teacherId, month, {
        date: values.date,
        amount: normalizeAmount(values.amount),
        method: values.method,
        ...(values.comment ? { comment: values.comment } : {}),
      }),
    )
      .then(onClose)
      .catch(() => undefined)
  }

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>Виплата</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                type="date"
                label="Дата"
                error={!!error}
                helperText={error?.message}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            )}
          />
          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Сума, грн" error={!!error} helperText={error?.message} fullWidth />
            )}
          />
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Спосіб" fullWidth>
                {methods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {payrollPaymentMethodLabels[method]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="comment"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Коментар" error={!!error} helperText={error?.message} fullWidth />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving} onClick={handleSubmit(onSubmit)}>
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  )
}
