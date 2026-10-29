import { Controller, useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { formatMoney, localToday, normalizeAmount, payrollApi, toKopecks, type ExtraHoursDto } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { usePayrollStore } from '../model/payrollStore'

type Mode = 'day' | 'month'

const monthLastDay = (month: string) => {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10)
}

const toNumber = (value: string) => Number(value.replace(',', '.'))

const schema = yup.object({
  mode: yup.mixed<Mode>().oneOf(['day', 'month']).required(),
  month: yup.string().required(),
  date: yup
    .string()
    .default('')
    .test('date', function (value) {
      if (this.parent.mode !== 'day') return true
      if (!value) return this.createError({ message: 'Вкажіть дату' })
      if (value.slice(0, 7) !== this.parent.month) return this.createError({ message: 'Дата має бути в цьому місяці' })
      if (value > localToday()) return this.createError({ message: 'Дата ще не настала' })
      return true
    }),
  hours: yup
    .string()
    .trim()
    .required('Вкажіть години')
    .matches(/^\d{1,3}([.,]\d{1,2})?$/, 'Неправильна кількість годин')
    .test('hours', function (value) {
      if (!value || !/^\d{1,3}([.,]\d{1,2})?$/.test(value)) return true
      if (this.parent.mode === 'month' && this.parent.month > localToday().slice(0, 7)) return this.createError({ message: 'Місяць ще не настав' })
      const hours = toNumber(value)
      if (hours <= 0) return this.createError({ message: 'Години мають бути більшими за 0' })
      if (this.parent.mode === 'day' && hours > 24) return this.createError({ message: 'Не більше 24 годин за день' })
      if (this.parent.mode === 'month' && hours > 400) return this.createError({ message: 'Не більше 400 годин' })
      return true
    }),
  rate: yup
    .string()
    .trim()
    .default('')
    .test('rate', 'Неправильна сума', (value) => !value || /^\d{1,8}([.,]\d{1,2})?$/.test(value))
    .test('rate-positive', 'Сума має бути більшою за 0', (value) => !value || !/^\d{1,8}([.,]\d{1,2})?$/.test(value) || toKopecks(value) > 0),
  comment: yup.string().trim().max(200, 'Не більше 200 символів').default(''),
})

type FormValues = yup.InferType<typeof schema>

export const ExtraHoursDialog = ({ onClose }: { onClose: () => void }) => {
  const isPhone = useIsPhone()
  const runDetail = usePayrollStore((s) => s.runDetail)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const month = usePayrollStore((s) => s.month)
  const termsRate = usePayrollStore((s) => s.detail?.extraHourRate ?? null)
  const today = localToday()
  const { control, handleSubmit, trigger } = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: {
      mode: 'day',
      month,
      date: today.slice(0, 7) === month ? today : monthLastDay(month),
      hours: '',
      rate: '',
      comment: '',
    },
  })
  const mode = useWatch({ control, name: 'mode' })
  const ownRate = useWatch({ control, name: 'rate' })

  const onSubmit = (values: FormValues) => {
    const dto: ExtraHoursDto = {
      ...(values.mode === 'day' ? { date: values.date } : {}),
      hours: values.hours.replace(',', '.'),
      ...(values.rate ? { rate: normalizeAmount(values.rate) } : {}),
      ...(values.comment ? { comment: values.comment } : {}),
    }
    runDetail((teacherId, sheetMonth) => payrollApi.addExtraHours(teacherId, sheetMonth, dto))
      .then(onClose)
      .catch(() => undefined)
  }

  return (
    <Dialog fullScreen={isPhone} open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>Додаткові години</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!termsRate && !ownRate && (
            <Alert severity="warning">
              В умовах оплати немає ставки за додаткову годину: без власної ставки години рахуватимуться з сумою 0.
            </Alert>
          )}
          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                exclusive
                size="small"
                value={field.value}
                onChange={(_, value: Mode | null) => {
                  if (!value) return
                  field.onChange(value)
                  trigger(['date', 'hours']).catch(() => undefined)
                }}
              >
                <ToggleButton value="day">За день</ToggleButton>
                <ToggleButton value="month">За місяць</ToggleButton>
              </ToggleButtonGroup>
            )}
          />
          {mode === 'day' && (
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
          )}
          <Controller
            name="hours"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Години" error={!!error} helperText={error?.message} fullWidth />
            )}
          />
          <Controller
            name="rate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Власна ставка, грн/год"
                error={!!error}
                helperText={
                  error?.message ?? (termsRate ? `Порожньо — ставка з умов оплати: ${formatMoney(termsRate)}` : 'Порожньо — ставки в умовах немає')
                }
                fullWidth
              />
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
          Додати
        </Button>
      </DialogActions>
    </Dialog>
  )
}
