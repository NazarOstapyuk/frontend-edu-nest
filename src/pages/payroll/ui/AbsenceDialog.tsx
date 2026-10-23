import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { addDaysIso, localToday, payrollApi } from '../../../shared/api'
import { usePayrollStore } from '../model/payrollStore'

const schema = yup.object({
  startDate: yup.string().required('Вкажіть дату початку'),
  endDate: yup
    .string()
    .default('')
    .test('end', function (value) {
      const start = this.parent.startDate as string
      if (!value || !start) return true
      if (value < start) return this.createError({ message: 'Кінець раніше за початок' })
      if (value > addDaysIso(start, 91)) return this.createError({ message: 'Не довше 92 днів' })
      return true
    }),
  paid: yup.boolean().required(),
  reason: yup.string().trim().required('Вкажіть причину').max(200, 'Не більше 200 символів'),
})

type FormValues = yup.InferType<typeof schema>

export const AbsenceDialog = ({ onClose }: { onClose: () => void }) => {
  const runDetail = usePayrollStore((s) => s.runDetail)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const month = usePayrollStore((s) => s.month)
  const today = localToday()
  const start = today.slice(0, 7) === month ? today : `${month}-01`
  const { control, handleSubmit, trigger } = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: { startDate: start, endDate: start, paid: false, reason: '' },
  })

  const onSubmit = (values: FormValues) => {
    runDetail(async (teacherId, sheetMonth) => {
      await payrollApi.addAbsence(teacherId, {
        startDate: values.startDate,
        endDate: values.endDate || values.startDate,
        paid: values.paid,
        reason: values.reason,
      })
      return payrollApi.getDetail(teacherId, sheetMonth)
    })
      .then(onClose)
      .catch(() => undefined)
  }

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>Відсутність</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Controller
            name="startDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                type="date"
                label="Початок"
                error={!!error}
                helperText={error?.message}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(event) => {
                  field.onChange(event)
                  trigger('endDate').catch(() => undefined)
                }}
                fullWidth
              />
            )}
          />
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                type="date"
                label="Кінець"
                error={!!error}
                helperText={error?.message}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            )}
          />
          <Controller
            name="paid"
            control={control}
            render={({ field }) => (
              <div>
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
                  label="Оплачувана (лікарняний, відпустка тощо)"
                />
                <FormHelperText sx={{ ml: 0 }}>Неоплачувана відсутність зменшує відпрацьовані дні</FormHelperText>
              </div>
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
