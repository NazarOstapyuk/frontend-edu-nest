import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'
import {
  normalizeAmount,
  payrollAdjustmentKindLabels,
  payrollApi,
  toKopecks,
  type PayrollAdjustmentKind,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { usePayrollStore } from '../model/payrollStore'

const kinds = Object.keys(payrollAdjustmentKindLabels) as PayrollAdjustmentKind[]

const schema = yup.object({
  kind: yup.mixed<PayrollAdjustmentKind>().oneOf(kinds).required(),
  amount: yup
    .string()
    .trim()
    .required('Вкажіть суму')
    .matches(/^\d{1,8}([.,]\d{1,2})?$/, 'Неправильна сума')
    .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0),
  reason: yup.string().trim().required('Вкажіть причину').max(500, 'Не більше 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

export const AdjustmentDialog = ({ onClose }: { onClose: () => void }) => {
  const isPhone = useIsPhone()
  const runDetail = usePayrollStore((s) => s.runDetail)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const { control, handleSubmit } = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: { kind: 'bonus', amount: '', reason: '' },
  })

  const onSubmit = (values: FormValues) => {
    runDetail((teacherId, month) =>
      payrollApi.addAdjustment(teacherId, month, {
        kind: values.kind,
        amount: normalizeAmount(values.amount),
        reason: values.reason,
      }),
    )
      .then(onClose)
      .catch(() => undefined)
  }

  return (
    <Dialog fullScreen={isPhone} open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>Доплата або утримання</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="kind"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Вид" fullWidth>
                {kinds.map((kind) => (
                  <MenuItem key={kind} value={kind}>
                    {payrollAdjustmentKindLabels[kind]}
                  </MenuItem>
                ))}
              </TextField>
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
            name="reason"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Причина" error={!!error} helperText={error?.message} fullWidth />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving} onClick={handleSubmit(onSubmit)}>
          Додати
        </Button>
      </DialogActions>
    </Dialog>
  )
}
