import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useTariffsStore } from '../model/tariffsStore'
import {
  billingModeLabels,
  billingModes,
  financeCategories,
  financeCategoryLabels,
  normalizeAmount,
  toKopecks,
  tariffUnitLabels,
  tariffUnits,
  type BillingMode,
  type FinanceCategory,
  type TariffUnit,
} from '../../../shared/api'

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").min(2, 'Мінімум 2 символи').max(100, 'Максимум 100 символів'),
  category: yup.mixed<FinanceCategory>().oneOf(financeCategories).required("Обов'язкове поле"),
  unit: yup.mixed<TariffUnit>().oneOf(tariffUnits).required("Обов'язкове поле"),
  packageSize: yup.string().default('').test('package', 'Вкажіть кількість занять (2–100)', function (value) {
    const { unit } = this.parent as { unit: TariffUnit }
    if (unit !== 'package') return true
    const size = Number(value)
    return Number.isInteger(size) && size >= 2 && size <= 100
  }),
  billingMode: yup.mixed<BillingMode>().oneOf(billingModes).required("Обов'язкове поле"),
  price: yup
    .string()
    .trim()
    .required("Обов'язкове поле")
    .matches(amountPattern, 'Невірна сума')
    .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0),
  effectiveFrom: yup.string().required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

const defaults: FormValues = {
  name: '',
  category: 'tuition',
  unit: 'month',
  packageSize: '',
  billingMode: 'calendar_full',
  price: '',
  effectiveFrom: '',
}

export const CreateTariffModal = () => {
  const { isOpen } = useTariffsStore((s) => s.createTariffModal)
  const setCreateTariffModal = useTariffsStore((s) => s.setCreateTariffModal)
  const createTariff = useTariffsStore((s) => s.createTariff)
  const isSaving = useTariffsStore((s) => s.isSaving)

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    mode: 'all',
    defaultValues: defaults,
    resolver: yupResolver(schema),
  })
  const unit = watch('unit')

  const handleClose = () => {
    reset(defaults)
    setCreateTariffModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createTariff({
      name: values.name.trim(),
      category: values.category,
      unit: values.unit,
      packageSize: values.unit === 'package' ? Number(values.packageSize) : undefined,
      billingMode: values.billingMode,
      price: normalizeAmount(values.price),
      effectiveFrom: values.effectiveFrom,
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий тариф</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="category"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Категорія" fullWidth error={!!error} helperText={error?.message}>
              {financeCategories.map((key) => (
                <MenuItem key={key} value={key}>{financeCategoryLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="unit"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} select label="Одиниця" fullWidth error={!!error} helperText={error?.message}>
                {tariffUnits.map((key) => (
                  <MenuItem key={key} value={key}>{tariffUnitLabels[key]}</MenuItem>
                ))}
              </TextField>
            )}
          />
          {unit === 'package' && (
            <Controller
              name="packageSize"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField {...field} label="Занять у пакеті" fullWidth error={!!error} helperText={error?.message} />
              )}
            />
          )}
        </Box>
        <Controller
          name="billingMode"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              select
              label="Режим періоду за замовчуванням"
              fullWidth
              error={!!error}
              helperText={error?.message}
            >
              {billingModes.map((key) => (
                <MenuItem key={key} value={key}>{billingModeLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="price"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Ціна, грн" fullWidth error={!!error} helperText={error?.message} />
            )}
          />
          <Controller
            name="effectiveFrom"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Діє з"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        </Box>
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
