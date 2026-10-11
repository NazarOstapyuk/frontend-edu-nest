import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import { useAdaptationStore } from '../model/adaptationStore'
import { formatMoney, normalizeAmount, toKopecks } from '../../../shared/api'

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/
const hoursPattern = /^\d{1,2}([.,]\d{1,2})?$/

const localToday = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const schema = yup.object({
  tariffId: yup.string().required("Обов'язкове поле"),
  date: yup.string().required("Обов'язкове поле"),
  hours: yup
    .string()
    .trim()
    .required("Обов'язкове поле")
    .matches(hoursPattern, 'Невірна кількість')
    .test('range', 'Від 0 до 24 годин', (value) => {
      const kopecks = toKopecks(value ?? '')
      return kopecks > 0 && kopecks <= 2400
    }),
  ratePerHour: yup
    .string()
    .trim()
    .default('')
    .test('rate', 'Невірна сума', (value) => !value || (amountPattern.test(value) && toKopecks(value) > 0)),
  note: yup.string().default('').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

export const CreateAdaptationVisitModal = () => {
  const { isOpen } = useAdaptationStore((s) => s.createVisitModal)
  const setCreateVisitModal = useAdaptationStore((s) => s.setCreateVisitModal)
  const tariffOptions = useAdaptationStore((s) => s.tariffOptions)
  const createVisit = useAdaptationStore((s) => s.createVisit)
  const isSaving = useAdaptationStore((s) => s.isSaving)
  const hourTariffs = tariffOptions.filter((t) => t.unit === 'hour' && t.isActive)

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { tariffId: '', date: localToday(), hours: '', ratePerHour: '', note: '' },
    resolver: yupResolver(schema),
  })
  const tariffId = watch('tariffId')
  const hours = watch('hours')
  const rate = watch('ratePerHour')
  const selected = hourTariffs.find((t) => t.id === tariffId)
  const effectiveRate = rate || selected?.currentPrice || ''
  const total = (toKopecks(hours) * toKopecks(effectiveRate)) / 10000

  const handleClose = () => {
    reset({ tariffId: '', date: localToday(), hours: '', ratePerHour: '', note: '' })
    setCreateVisitModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createVisit({
      tariffId: values.tariffId,
      date: values.date,
      hours: normalizeAmount(values.hours),
      ratePerHour: values.ratePerHour ? normalizeAmount(values.ratePerHour) : undefined,
      note: values.note.trim() || undefined,
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Відвідування адаптації</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="tariffId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Тариф" fullWidth error={!!error} helperText={error?.message}>
              {hourTariffs.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                  {t.currentPrice ? ` — ${formatMoney(t.currentPrice)}/год` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Дата"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Controller
            name="hours"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Годин" fullWidth error={!!error} helperText={error?.message} />
            )}
          />
        </Box>
        <Controller
          name="ratePerHour"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Ставка за годину, грн"
              placeholder={selected?.currentPrice ?? ''}
              fullWidth
              error={!!error}
              helperText={error?.message ?? 'Порожньо — ставка з тарифу на цю дату'}
            />
          )}
        />
        <Controller
          name="note"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Примітка" fullWidth multiline error={!!error} helperText={error?.message} />
          )}
        />
        <Typography variant="body2" color="text.secondary">
          Буде нараховано: {formatMoney(total)}
        </Typography>
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
