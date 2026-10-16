import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import { useChildFinanceStore } from '../model/childFinanceStore'
import { allocationItemSchema, amountSchema } from '../model/schemas'
import { AllocationTable } from './AllocationTable'
import {
  financeCategories,
  financeCategoryLabels,
  formatMoney,
  normalizeAmount,
  paymentMethodLabels,
  toAllocationItems,
  toKopecks,
  type FinanceCategory,
  type ManualPaymentMethod,
  type SuggestionLine,
} from '../../../shared/api'

const manualMethods: ManualPaymentMethod[] = ['cash', 'bank_transfer', 'card']

const schema = yup.object({
  amount: amountSchema,
  method: yup.mixed<ManualPaymentMethod>().oneOf(manualMethods).required("Обов'язкове поле"),
  reference: yup.string().trim().required("Обов'язкове поле").max(255, 'Максимум 255 символів'),
  receivedAt: yup.string().required("Обов'язкове поле"),
  category: yup.string().default(''),
  note: yup.string().default('').max(1000, 'Максимум 1000 символів'),
  allocations: yup.array().of(allocationItemSchema).default([]),
})

type FormValues = yup.InferType<typeof schema>

const today = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export const CreatePaymentModal = () => {
  const finance = useChildFinanceStore((s) => s.finance)
  const { isOpen } = useChildFinanceStore((s) => s.createPaymentModal)
  const setCreatePaymentModal = useChildFinanceStore((s) => s.setCreatePaymentModal)
  const createPayment = useChildFinanceStore((s) => s.createPayment)
  const suggestAllocation = useChildFinanceStore((s) => s.suggestAllocation)
  const isSaving = useChildFinanceStore((s) => s.isSaving)
  const [lines, setLines] = useState<SuggestionLine[]>([])

  const { control, handleSubmit, reset, setValue, getValues, trigger, watch } = useForm<FormValues>({
    mode: 'all',
    defaultValues: {
      amount: '',
      method: 'cash',
      reference: '',
      receivedAt: today(),
      category: '',
      note: '',
      allocations: [],
    },
    resolver: yupResolver(schema),
  })

  const total = toKopecks(watch('amount'))
  const distributed = watch('allocations').reduce((acc, item) => acc + toKopecks(item.amount), 0)
  const category = watch('category')

  const clearAllocation = () => {
    setLines([])
    setValue('allocations', [])
  }

  const handleClose = () => {
    reset({ amount: '', method: 'cash', reference: '', receivedAt: today(), category: '', note: '', allocations: [] })
    setLines([])
    setCreatePaymentModal({ isOpen: false })
  }

  const handleSuggest = async () => {
    if (!finance || !(await trigger('amount'))) return
    const values = getValues()
    const data = await suggestAllocation(finance.child.id, {
      amount: normalizeAmount(values.amount),
      category: values.category ? (values.category as FinanceCategory) : undefined,
    })
    setLines(data.lines)
    setValue(
      'allocations',
      data.lines.map((line) => ({
        chargeId: line.chargeId,
        amount: Number(line.suggestedAmount) > 0 ? line.suggestedAmount : '',
      })),
    )
  }

  const onSubmit = async (values: FormValues) => {
    if (!finance) return
    await createPayment(finance.child.id, {
      amount: normalizeAmount(values.amount),
      method: values.method,
      reference: values.reference.trim(),
      receivedAt: values.receivedAt,
      category: values.category ? (values.category as FinanceCategory) : undefined,
      note: values.note.trim() || undefined,
      allocations: toAllocationItems(values.allocations),
    })
    handleClose()
  }

  const rest = total - distributed
  const isOver = (index: number, amount: string | undefined) =>
    toKopecks(amount ?? '') > toKopecks(lines[index]?.remaining ?? '0')
  const anyOver = watch('allocations').some((item, index) => isOver(index, item.amount))

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Внести оплату</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                onChange={(e) => {
                  field.onChange(e)
                  clearAllocation()
                }}
                label="Сума, грн"
                fullWidth
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Controller
            name="method"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} select label="Спосіб" fullWidth error={!!error} helperText={error?.message}>
                {manualMethods.map((key) => (
                  <MenuItem key={key} value={key}>{paymentMethodLabels[key]}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="reference"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Реквізит (№ квитанції / переказу)"
                fullWidth
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Controller
            name="receivedAt"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Дата надходження"
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
          name="category"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              onChange={(e) => {
                field.onChange(e)
                clearAllocation()
              }}
              select
              label="Призначення"
              fullWidth
              error={!!error}
              helperText={error?.message}
            >
              <MenuItem value="">Без категорії</MenuItem>
              {financeCategories.map((key) => (
                <MenuItem key={key} value={key}>{financeCategoryLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="note"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Примітка" fullWidth multiline error={!!error} helperText={error?.message} />
          )}
        />

        <Box>
          <Button variant="outlined" onClick={handleSuggest} sx={{ mb: 2 }}>
            Запропонувати розподіл
          </Button>
          {lines.length > 0 && (
            <AllocationTable
              lines={lines}
              renderAmountField={(index) => (
                <Controller
                  name={`allocations.${index}.amount`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      size="small"
                      error={!!error || isOver(index, field.value)}
                      helperText={error?.message ?? (isOver(index, field.value) ? 'Більше за залишок' : undefined)}
                    />
                  )}
                />
              )}
            />
          )}
          <Typography variant="body2" sx={{ mt: 1, color: rest < 0 ? 'error.main' : 'text.secondary' }}>
            Розподілено {formatMoney(distributed / 100)} з {formatMoney(total / 100)}
            {rest > 0 && `, решта ${formatMoney(rest / 100)} — ${category ? 'передоплата' : 'нерозподілено'}`}
            {rest < 0 && ' — розподілено більше, ніж сума оплати'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSaving || rest < 0 || anyOver}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
