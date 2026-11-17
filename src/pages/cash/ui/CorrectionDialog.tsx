import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  cashDirectionLabels,
  formatMoney,
  normalizeAmount,
  toKopecks,
  type CashDirection,
} from '../../../shared/api'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { brandColors } from '../../../shared/assets/brand'
import { useCashStore } from '../model/cashStore'

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/
const directions = Object.keys(cashDirectionLabels) as CashDirection[]

const schema = yup.object({
  sign: yup.number().oneOf([1, -1]).required(),
  amount: yup
    .string()
    .trim()
    .required("Обов'язкове поле")
    .matches(amountPattern, 'Невірна сума')
    .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0),
  direction: yup.mixed<CashDirection>().oneOf(directions).required("Обов'язкове поле"),
  comment: yup.string().trim().required('Вкажіть причину').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

const makeDefaults = (): FormValues => ({
  sign: 1,
  amount: '',
  direction: 'shared',
  comment: '',
})

export const CorrectionDialog = () => {
  const isPhone = useIsPhone()
  const { isOpen, desk } = useCashStore((s) => s.correctionDialog)
  const setCorrectionDialog = useCashStore((s) => s.setCorrectionDialog)
  const createCorrection = useCashStore((s) => s.createCorrection)
  const isCreating = useCashStore((s) => s.isCreating)
  const push = useNotifyStore((s) => s.push)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: makeDefaults(),
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset(makeDefaults())
    setCorrectionDialog({ isOpen: false, desk: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!desk) return
    await createCorrection(desk.id, {
      sign: values.sign === -1 ? -1 : 1,
      amount: normalizeAmount(values.amount),
      direction: values.direction,
      comment: values.comment.trim(),
    })
    push('Коригування записано', 'success')
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 800 }}>Коригування каси</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: '20px', pb: '20px' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 2,
            borderRadius: '16px',
            bgcolor: brandColors.oliveTint,
            color: brandColors.inkOnOlive,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>Має бути в касі</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{formatMoney(desk?.openShift?.expected ?? '0')}</Typography>
        </Box>
        <Controller
          name="sign"
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={field.value}
              onChange={(_, value: number | null) => {
                if (value !== null) field.onChange(value)
              }}
            >
              <ToggleButton value={1} sx={{ minHeight: 44, fontWeight: 800 }}>
                Додати
              </ToggleButton>
              <ToggleButton value={-1} sx={{ minHeight: 44, fontWeight: 800 }}>
                Відняти
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        />
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Сума, грн"
              fullWidth
              error={!!error}
              helperText={error?.message}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          )}
        />
        <Controller
          name="direction"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Напрям" fullWidth error={!!error} helperText={error?.message}>
              {directions.map((key) => (
                <MenuItem key={key} value={key}>
                  {cashDirectionLabels[key]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="comment"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Причина"
              required
              fullWidth
              multiline
              minRows={2}
              error={!!error}
              helperText={error?.message ?? 'Коригування бачать у звітах разом із причиною'}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isCreating} sx={{ width: '100%' }}>
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
