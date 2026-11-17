import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Dialog, DialogTitle, Link, ListSubheader, MenuItem, TextField, Typography } from '@mui/material'
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
  type AllocationSuggestion,
  type AllocationSuggestionDto,
  type ChildFinance,
  type FinanceCategory,
  type ManualPaymentMethod,
  type SuggestionLine,
} from '../../../shared/api'
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { DateField } from '../../../shared/ui/DateField'

const manualMethods: ManualPaymentMethod[] = ['cash', 'bank_transfer', 'card']

const CHARGE_PREFIX = 'charge:'

const toFormAllocations = (lines: SuggestionLine[]) =>
  lines.map((line) => ({
    chargeId: line.chargeId,
    amount: Number(line.suggestedAmount) > 0 ? line.suggestedAmount : '',
  }))

const getOpenCharges = (finance: ChildFinance) =>
  finance.charges.filter((c) => !c.voidedAt && Number(c.remaining) > 0)

const findSelectedCharge = (finance: ChildFinance, category: string) =>
  category.startsWith(CHARGE_PREFIX)
    ? getOpenCharges(finance).find((c) => c.id === category.slice(CHARGE_PREFIX.length))
    : undefined

const getPaymentCategory = (finance: ChildFinance, category: string): FinanceCategory | undefined =>
  findSelectedCharge(finance, category)?.category ??
  (category && !category.startsWith(CHARGE_PREFIX) ? (category as FinanceCategory) : undefined)

const loadLines = async (
  finance: ChildFinance,
  category: string,
  amount: string,
  suggest: (childId: string, dto: AllocationSuggestionDto) => Promise<AllocationSuggestion>,
): Promise<SuggestionLine[]> => {
  const charge = findSelectedCharge(finance, category)
  if (charge) {
    const take = Math.min(toKopecks(amount), toKopecks(charge.remaining))
    return [
      {
        chargeId: charge.id,
        category: charge.category,
        description: charge.description,
        periodStart: charge.periodStart,
        createdAt: charge.createdAt,
        remaining: charge.remaining,
        suggestedAmount: (take / 100).toFixed(2),
      },
    ]
  }
  const data = await suggest(finance.child.id, {
    amount: normalizeAmount(amount),
    category: getPaymentCategory(finance, category),
  })
  return data.lines
}

const today = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const schema = yup.object({
  amount: amountSchema,
  method: yup.mixed<ManualPaymentMethod>().oneOf(manualMethods).required("Обов'язкове поле"),
  reference: yup.string().trim().default('').max(255, 'Максимум 255 символів'),
  receivedAt: yup
    .string()
    .required("Обов'язкове поле")
    .test('not-future', 'Дата не може бути в майбутньому', (value) => !value || value <= today()),
  category: yup.string().default(''),
  note: yup.string().default('').max(1000, 'Максимум 1000 символів'),
  payerName: yup.string().trim().required("Обов'язкове поле").max(255, 'Максимум 255 символів'),
  periodFrom: yup.string().default(''),
  periodTo: yup
    .string()
    .default('')
    .test('period-order', 'Кінець періоду раніше початку', function (value) {
      const from = this.parent.periodFrom as string | undefined
      return !value || !from || value >= from
    }),
  cashDeskId: yup
    .string()
    .default('')
    .test('desk-required', "Обов'язкове поле", function (value) {
      return this.parent.method !== 'cash' || !!value
    }),
  allocations: yup.array().of(allocationItemSchema).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const CreatePaymentModal = () => {
  const isPhone = useIsPhone()
  const finance = useChildFinanceStore((s) => s.finance)
  const { isOpen } = useChildFinanceStore((s) => s.createPaymentModal)
  const setCreatePaymentModal = useChildFinanceStore((s) => s.setCreatePaymentModal)
  const createPayment = useChildFinanceStore((s) => s.createPayment)
  const suggestAllocation = useChildFinanceStore((s) => s.suggestAllocation)
  const isSaving = useChildFinanceStore((s) => s.isSaving)
  const presetMethod = useChildFinanceStore((s) => s.createPaymentModal.presetMethod)
  const presetDeskId = useChildFinanceStore((s) => s.createPaymentModal.presetDeskId)
  const cashDesks = useChildFinanceStore((s) => s.cashDesks)
  const isLoadingDesks = useChildFinanceStore((s) => s.isLoadingDesks)
  const fetchCashDesks = useChildFinanceStore((s) => s.fetchCashDesks)
  const canCashView = useCan('cash', 'view')
  const canCashControlView = useCan('cash_control', 'view')
  const canFinanceView = useCan('finance', 'view')
  const canCashEdit = useCan('cash', 'edit')
  const [lines, setLines] = useState<SuggestionLine[]>([])
  const cleared = useRef(false)

  const { control, handleSubmit, reset, setValue, getValues, trigger, watch } = useForm<FormValues>({
    mode: 'all',
    defaultValues: {
      amount: '',
      method: 'cash',
      reference: '',
      receivedAt: today(),
      category: '',
      note: '',
      payerName: '',
      periodFrom: '',
      periodTo: '',
      cashDeskId: '',
      allocations: [],
    },
    resolver: yupResolver(schema),
  })

  const total = toKopecks(watch('amount'))
  const distributed = watch('allocations').reduce((acc, item) => acc + toKopecks(item.amount), 0)
  const category = watch('category')
  const amountValue = watch('amount')
  const method = watch('method')
  const cashDeskId = watch('cashDeskId')
  const canLoadDesks = canCashView || canCashControlView || canFinanceView
  const noDesk = method === 'cash' && cashDesks.length === 0 && !isLoadingDesks

  const openCharges = finance ? getOpenCharges(finance) : []
  const paymentCategory = finance ? getPaymentCategory(finance, category) : undefined

  const clearAllocation = () => {
    setLines([])
    setValue('allocations', [])
  }

  const applyLines = (next: SuggestionLine[]) => {
    setLines(next)
    setValue('allocations', toFormAllocations(next))
  }

  useEffect(() => {
    if (!isOpen || !finance) return
    const withDebt = finance.categories.filter((c) => Number(c.debt) > 0)
    setValue('category', withDebt.length === 1 ? withDebt[0].category : '')
  }, [isOpen, finance, setValue])

  useEffect(() => {
    if (isOpen && canLoadDesks) fetchCashDesks()
  }, [isOpen, canLoadDesks, fetchCashDesks])

  useEffect(() => {
    if (isOpen && presetMethod) setValue('method', presetMethod)
  }, [isOpen, presetMethod, setValue])

  useEffect(() => {
    if (!isOpen) return
    const current = getValues('cashDeskId')
    const next =
      cashDesks.find((d) => d.id === presetDeskId)?.id ??
      (cashDesks.length === 1 ? cashDesks[0].id : cashDesks.find((d) => d.id === current)?.id ?? '')
    if (next !== current) setValue('cashDeskId', next, { shouldValidate: true })
  }, [isOpen, cashDesks, presetDeskId, getValues, setValue])

  useEffect(() => {
    cleared.current = false
    setLines([])
    setValue('allocations', [])
    if (!isOpen || !finance || !amountSchema.isValidSync(amountValue)) return
    let active = true
    const timer = setTimeout(async () => {
      const next = await loadLines(finance, category, amountValue, suggestAllocation).catch(() => null)
      if (!active || !next) return
      setLines(next)
      setValue('allocations', toFormAllocations(next))
    }, 500)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [isOpen, finance, amountValue, category, suggestAllocation, setValue])

  const handleClose = () => {
    cleared.current = false
    reset({
      amount: '',
      method: 'cash',
      reference: '',
      receivedAt: today(),
      category: '',
      note: '',
      payerName: '',
      periodFrom: '',
      periodTo: '',
      cashDeskId: '',
      allocations: [],
    })
    setLines([])
    setCreatePaymentModal({ isOpen: false, presetMethod: undefined, presetDeskId: undefined })
  }

  const handleSuggest = async () => {
    if (!finance || !(await trigger('amount'))) return
    applyLines(await loadLines(finance, category, getValues('amount'), suggestAllocation))
  }

  const onSubmit = async (values: FormValues) => {
    if (!finance) return
    let allocations = toAllocationItems(values.allocations)
    if (!allocations.length && !cleared.current && lines.length === 0) {
      const next = await loadLines(finance, values.category, values.amount, suggestAllocation)
      allocations = toAllocationItems(toFormAllocations(next))
    }
    await createPayment(finance.child.id, {
      amount: normalizeAmount(values.amount),
      method: values.method,
      reference: values.reference.trim() || undefined,
      receivedAt: values.receivedAt,
      category: paymentCategory,
      note: values.note.trim() || undefined,
      payerName: values.payerName.trim(),
      periodFrom: values.periodFrom || undefined,
      periodTo: values.periodTo || undefined,
      cashDeskId: values.method === 'cash' ? values.cashDeskId : undefined,
      allocations,
    })
    handleClose()
  }

  const rest = total - distributed
  const isOver = (index: number, amount: string | undefined) =>
    toKopecks(amount ?? '') > toKopecks(lines[index]?.remaining ?? '0')
  const anyOver = watch('allocations').some((item, index) => isOver(index, item.amount))

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Внести оплату</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
              <DateField
                {...field}
                label="Дата надходження"
                fullWidth
                max={today()}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        </Box>
        {method === 'cash' && cashDesks.length === 1 && (
          <Typography variant="body2" color="text.secondary">
            Каса: {cashDesks[0].name}
          </Typography>
        )}
        {method === 'cash' && cashDesks.length > 1 && (
          <Controller
            name="cashDeskId"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} select label="Каса" fullWidth error={!!error} helperText={error?.message}>
                {cashDesks.map((desk) => (
                  <MenuItem key={desk.id} value={desk.id}>{desk.name}</MenuItem>
                ))}
              </TextField>
            )}
          />
        )}
        {noDesk && (
          <Alert severity="warning">
            Немає відкритої касової зміни. Відкрийте зміну на сторінці «Каса», щоб прийняти готівку.
            {canCashEdit && (
              <>
                {' '}
                <Link component={RouterLink} to="/cash" onClick={handleClose}>
                  Перейти до каси
                </Link>
              </>
            )}
          </Alert>
        )}
        <Controller
          name="payerName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Платник" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Controller
            name="periodFrom"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateField
                {...field}
                label="Період з"
                fullWidth
                error={!!error}
                helperText={error?.message}
                onChange={(value) => {
                  field.onChange(value)
                  trigger('periodTo')
                }}
              />
            )}
          />
          <Controller
            name="periodTo"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateField {...field} label="Період по" fullWidth error={!!error} helperText={error?.message} />
            )}
          />
        </Box>
        <Controller
          name="category"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
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
              {openCharges.length > 0 && <ListSubheader>Неоплачені нарахування</ListSubheader>}
              {openCharges.map((charge) => (
                <MenuItem key={charge.id} value={`${CHARGE_PREFIX}${charge.id}`} sx={{ whiteSpace: 'normal' }}>
                  {charge.description} — {formatMoney(charge.remaining)}
                </MenuItem>
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
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={handleSuggest}>
              Запропонувати розподіл
            </Button>
            {lines.length > 0 && (
              <Button
                color="inherit"
                onClick={() => {
                  cleared.current = true
                  clearAllocation()
                }}
              >
                Очистити розподіл
              </Button>
            )}
          </Box>
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
            disabled={isSaving || rest < 0 || anyOver || (method === 'cash' && (isLoadingDesks || noDesk || !cashDeskId))}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
