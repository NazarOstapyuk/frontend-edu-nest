import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import {
  financeCategories,
  financeCategoryLabels,
  normalizeAmount,
  onlinePaymentsApi,
  payAmountError,
  type CategorySummary,
  type FinanceCategory,
} from '../../../shared/api'
import { useNotifyStore } from '../../../shared/model/notifyStore'

interface PaymentLinkModalProps {
  childId: string
  categories: CategorySummary[]
  onClose: () => void
  onCreated: () => void
}

const debtOf = (categories: CategorySummary[], category: FinanceCategory) => {
  const debt = categories.find((c) => c.category === category)?.debt ?? '0'
  return Number(debt) > 0 ? debt : ''
}

export const PaymentLinkModal = ({ childId, categories, onClose, onCreated }: PaymentLinkModalProps) => {
  const [category, setCategory] = useState<FinanceCategory>(financeCategories[0])
  const [amount, setAmount] = useState(() => debtOf(categories, financeCategories[0]))
  const [comment, setComment] = useState('')
  const [touched, setTouched] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{ url: string; expiresAt: string } | null>(null)
  const error = payAmountError(amount)

  const changeCategory = (next: FinanceCategory) => {
    setCategory(next)
    setAmount(debtOf(categories, next))
  }

  const submit = async () => {
    setTouched(true)
    if (error) return
    setIsSending(true)
    try {
      const { data } = await onlinePaymentsApi.createLink(childId, {
        category,
        amount: normalizeAmount(amount),
        comment: comment.trim() || undefined,
      })
      setResult({ url: data.url, expiresAt: data.expiresAt })
      onCreated()
    } catch {
      return
    } finally {
      setIsSending(false)
    }
  }

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.url)
      useNotifyStore.getState().push('Посилання скопійовано', 'success')
    } catch {
      useNotifyStore.getState().push('Не вдалося скопіювати посилання')
    }
  }

  return (
    <Dialog open onClose={isSending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Посилання на оплату</DialogTitle>
      <DialogContent>
        {result ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Посилання" value={result.url} fullWidth slotProps={{ input: { readOnly: true } }} />
            <Typography variant="body2" color="text.secondary">
              Діє до: {new Date(result.expiresAt).toLocaleString('uk-UA')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField select label="Категорія" value={category} onChange={(e) => changeCategory(e.target.value as FinanceCategory)} fullWidth>
              {financeCategories.map((key) => (
                <MenuItem key={key} value={key}>{financeCategoryLabels[key]}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Сума, грн"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setTouched(true)}
              error={touched && !!error}
              helperText={touched ? error : undefined}
              fullWidth
            />
            <TextField
              label="Коментар"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {result ? (
          <>
            <Button onClick={copy}>Копіювати</Button>
            <Button variant="contained" onClick={onClose}>Закрити</Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSending}>Скасувати</Button>
            <Button variant="contained" onClick={submit} disabled={isSending}>Створити</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
