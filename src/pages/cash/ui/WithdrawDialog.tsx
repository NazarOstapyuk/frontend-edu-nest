import { useEffect } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Alert, Box, Button, Dialog, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import {
  cashDirectionLabels,
  cashExpenseCategoryLabels,
  formatMoney,
  normalizeAmount,
  toKopecks,
  type CashDirection,
  type CashExpenseCategory,
} from '../../../shared/api'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { brandColors } from '../../../shared/assets/brand'
import { useCashStore } from '../model/cashStore'

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/
const directions = Object.keys(cashDirectionLabels) as CashDirection[]
const expenseCategories = Object.keys(cashExpenseCategoryLabels) as CashExpenseCategory[]

interface WithdrawContext {
  kind: 'expense' | 'transfer'
  balanceKopecks: number
}

const contextOf = (options: { context?: unknown }) => (options.context ?? {}) as WithdrawContext

const schema = yup.object({
  amount: yup
    .string()
    .trim()
    .required("Обов'язкове поле")
    .matches(amountPattern, 'Невірна сума')
    .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0)
    .test('balance', 'У касі немає стільки готівки', function (value) {
      return toKopecks(value ?? '') <= contextOf(this.options).balanceKopecks
    }),
  direction: yup.mixed<CashDirection>().oneOf(directions).required("Обов'язкове поле"),
  expenseCategory: yup
    .string()
    .default('')
    .test('required', 'Оберіть категорію', function (value) {
      return contextOf(this.options).kind !== 'expense' || !!value
    }),
  recipientId: yup
    .string()
    .default('')
    .test('required', 'Оберіть отримувача', function (value) {
      return contextOf(this.options).kind !== 'transfer' || !!value
    }),
  comment: yup
    .string()
    .trim()
    .default('')
    .max(500, 'Максимум 500 символів')
    .test('required', 'Опишіть витрату', function (value) {
      const { expenseCategory } = this.parent as { expenseCategory: string }
      return contextOf(this.options).kind !== 'expense' || expenseCategory !== 'other' || !!value?.trim()
    }),
})

type FormValues = yup.InferType<typeof schema>

const makeDefaults = (): FormValues => ({
  amount: '',
  direction: 'shared',
  expenseCategory: '',
  recipientId: '',
  comment: '',
})

export const WithdrawDialog = () => {
  const isPhone = useIsPhone()
  const { isOpen, kind, desk } = useCashStore((s) => s.withdrawDialog)
  const setWithdrawDialog = useCashStore((s) => s.setWithdrawDialog)
  const createEntry = useCashStore((s) => s.createEntry)
  const fetchRecipients = useCashStore((s) => s.fetchRecipients)
  const recipients = useCashStore((s) => s.recipients)
  const isCreating = useCashStore((s) => s.isCreating)
  const push = useNotifyStore((s) => s.push)

  const balance = desk?.openShift?.expected ?? '0'
  const balanceKopecks = toKopecks(balance)
  const isExpense = kind === 'expense'

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: makeDefaults(),
    resolver: yupResolver(schema),
    context: { kind, balanceKopecks },
  })
  const amount = useWatch({ control, name: 'amount' })
  const category = useWatch({ control, name: 'expenseCategory' })
  const isLarge = !!desk && toKopecks(amount ?? '') > 0 && toKopecks(amount ?? '') >= toKopecks(desk.largeAmount)

  useEffect(() => {
    if (isOpen && kind === 'transfer') fetchRecipients().catch(() => undefined)
  }, [isOpen, kind, fetchRecipients])

  const handleClose = () => {
    reset(makeDefaults())
    setWithdrawDialog({ isOpen: false, desk: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!desk) return
    const comment = values.comment.trim() || undefined
    await createEntry(
      desk.id,
      isExpense
        ? {
            kind: 'expense',
            amount: normalizeAmount(values.amount),
            direction: values.direction,
            expenseCategory: values.expenseCategory as CashExpenseCategory,
            comment,
          }
        : {
            kind: 'transfer',
            amount: normalizeAmount(values.amount),
            direction: values.direction,
            recipientId: values.recipientId,
            comment,
          },
    )
    push(isExpense ? 'Видачу записано' : 'Передачу записано', 'success')
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 800 }}>{isExpense ? 'Видати кошти' : 'Передати кошти'}</DialogTitle>
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
          <Typography sx={{ fontWeight: 700 }}>Залишок у касі</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{formatMoney(balance)}</Typography>
        </Box>
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
        {isLarge && <Alert severity="info">Керівник отримає сповіщення про велику видачу</Alert>}
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
        {isExpense ? (
          <Controller
            name="expenseCategory"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} select label="Категорія" fullWidth error={!!error} helperText={error?.message}>
                {expenseCategories.map((key) => (
                  <MenuItem key={key} value={key}>
                    {cashExpenseCategoryLabels[key]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        ) : (
          <Controller
            name="recipientId"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                select
                label="Кому"
                fullWidth
                error={!!error}
                helperText={error?.message ?? (recipients.length === 0 ? 'Немає співробітників для передачі' : undefined)}
              >
                {recipients.map((person) => (
                  <MenuItem key={person.id} value={person.id}>
                    {person.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}
        <Controller
          name="comment"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Коментар"
              required={isExpense && category === 'other'}
              fullWidth
              multiline
              minRows={2}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isCreating} sx={{ width: '100%' }}>
            {isExpense ? 'Видати' : 'Передати'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
