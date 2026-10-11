import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useEnrollmentsStore } from '../model/enrollmentsStore'
import {
  adjustmentTypeLabels,
  adjustmentTypes,
  normalizeAmount,
  toKopecks,
  type AdjustmentType,
} from '../../../shared/api'

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/

const schema = yup.object({
  type: yup.mixed<AdjustmentType>().oneOf(adjustmentTypes).required("Обов'язкове поле"),
  value: yup
    .string()
    .trim()
    .default('')
    .test('value', 'Невірне значення', function (value) {
      const { type } = this.parent as { type: AdjustmentType }
      if (type === 'pause') return true
      if (!value || !amountPattern.test(value)) return false
      const kopecks = toKopecks(value)
      return type === 'discount_percent' ? kopecks > 0 && kopecks <= 10000 : kopecks > 0
    }),
  startDate: yup.string().required("Обов'язкове поле"),
  endDate: yup
    .string()
    .default('')
    .test('after-start', 'Кінець раніше за початок', function (value) {
      const { startDate } = this.parent as { startDate: string }
      return !value || !startDate || value >= startDate
    }),
  reason: yup.string().trim().required('Вкажіть причину').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

const defaults: FormValues = { type: 'discount_percent', value: '', startDate: '', endDate: '', reason: '' }

export const AdjustmentModal = () => {
  const { isOpen, enrollment } = useEnrollmentsStore((s) => s.adjustmentModal)
  const setAdjustmentModal = useEnrollmentsStore((s) => s.setAdjustmentModal)
  const addAdjustment = useEnrollmentsStore((s) => s.addAdjustment)
  const isSaving = useEnrollmentsStore((s) => s.isSaving)

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    mode: 'all',
    defaultValues: defaults,
    resolver: yupResolver(schema),
  })
  const type = watch('type')

  const handleClose = () => {
    reset(defaults)
    setAdjustmentModal({ isOpen: false, enrollment: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!enrollment) return
    await addAdjustment(enrollment.id, {
      type: values.type,
      value: values.type === 'pause' ? undefined : normalizeAmount(values.value),
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      reason: values.reason.trim(),
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Умова: {enrollment?.tariff.name}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="type"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Тип" fullWidth error={!!error} helperText={error?.message}>
              {adjustmentTypes.map((key) => (
                <MenuItem key={key} value={key}>{adjustmentTypeLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />
        {type !== 'pause' && (
          <Controller
            name="value"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label={type === 'discount_percent' ? 'Відсоток' : 'Сума, грн'}
                fullWidth
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="startDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="З"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="По"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        </Box>
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
