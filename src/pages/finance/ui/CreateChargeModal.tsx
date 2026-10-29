import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useChildFinanceStore } from '../model/childFinanceStore'
import { amountSchema } from '../model/schemas'
import {
  financeCategories,
  financeCategoryLabels,
  normalizeAmount,
  type FinanceCategory,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  category: yup.mixed<FinanceCategory>().oneOf(financeCategories).required("Обов'язкове поле"),
  amount: amountSchema,
  description: yup.string().trim().required("Обов'язкове поле").max(255, 'Максимум 255 символів'),
  periodStart: yup.string().default(''),
  periodEnd: yup
    .string()
    .default('')
    .test('both', 'Вкажіть обидві дати періоду', function (value) {
      const { periodStart } = this.parent as { periodStart: string }
      return !!value === !!periodStart
    })
    .test('after-start', 'Кінець періоду раніше за початок', function (value) {
      const { periodStart } = this.parent as { periodStart: string }
      return !value || !periodStart || value >= periodStart
    }),
})

type FormValues = yup.InferType<typeof schema>

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const currentMonth = () => {
  const now = new Date()
  return {
    periodStart: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    periodEnd: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

const makeDefaults = (): FormValues => ({
  category: 'tuition',
  amount: '',
  description: '',
  ...currentMonth(),
})

export const CreateChargeModal = () => {
  const isPhone = useIsPhone()
  const finance = useChildFinanceStore((s) => s.finance)
  const { isOpen } = useChildFinanceStore((s) => s.createChargeModal)
  const setCreateChargeModal = useChildFinanceStore((s) => s.setCreateChargeModal)
  const createCharge = useChildFinanceStore((s) => s.createCharge)
  const isSaving = useChildFinanceStore((s) => s.isSaving)

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: makeDefaults(),
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (!isOpen || !finance) return
    const largest = finance.categories.reduce<(typeof finance.categories)[number] | null>(
      (best, c) => (Number(c.debt) > Number(best?.debt ?? 0) ? c : best),
      null,
    )
    setValue('category', largest?.category ?? 'tuition')
  }, [isOpen, finance, setValue])

  const handleClose = () => {
    reset(makeDefaults())
    setCreateChargeModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    if (!finance) return
    await createCharge(finance.child.id, {
      category: values.category,
      amount: normalizeAmount(values.amount),
      description: values.description.trim(),
      periodStart: values.periodStart || undefined,
      periodEnd: values.periodEnd || undefined,
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Нове нарахування</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
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
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Сума, грн" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Опис" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Controller
            name="periodStart"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Початок періоду"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Controller
            name="periodEnd"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Кінець періоду"
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
