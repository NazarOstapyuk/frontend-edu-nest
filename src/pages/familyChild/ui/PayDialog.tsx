import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import {
  financeCategoryLabels,
  normalizeAmount,
  onlinePaymentsApi,
  payAmountError,
  type FinanceCategory,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

interface PayDialogProps {
  childId: string
  category: FinanceCategory
  due: string
  onClose: () => void
}

export const PayDialog = ({ childId, category, due, onClose }: PayDialogProps) => {
  const isPhone = useIsPhone()
  const [amount, setAmount] = useState(Number(due) > 0 ? due : '')
  const [touched, setTouched] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const error = payAmountError(amount)

  const submit = async () => {
    setTouched(true)
    if (error) return
    setIsSending(true)
    try {
      const { data } = await onlinePaymentsApi.payCategory(childId, { category, amount: normalizeAmount(amount) })
      window.location.assign(data.pageUrl)
    } catch {
      setIsSending(false)
    }
  }

  return (
    <Dialog open onClose={isSending ? undefined : onClose} fullWidth maxWidth="xs" fullScreen={isPhone}>
      <DialogTitle>Оплата онлайн</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography>Призначення: {financeCategoryLabels[category]}</Typography>
          <TextField
            label="Сума, грн"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched(true)}
            error={touched && !!error}
            helperText={touched ? error : undefined}
            fullWidth
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSending} sx={{ minHeight: isPhone ? 44 : undefined }}>Скасувати</Button>
        <Button variant="contained" onClick={submit} disabled={isSending} sx={{ minHeight: isPhone ? 44 : undefined }}>
          Перейти до оплати
        </Button>
      </DialogActions>
    </Dialog>
  )
}
