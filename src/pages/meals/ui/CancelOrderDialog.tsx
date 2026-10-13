import { useState } from 'react'
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { formatDay, type AdminMealOrder } from '../../../shared/api'

export const CancelOrderDialog = ({ order, onClose }: { order: AdminMealOrder; onClose: () => void }) => {
  const isSaving = useMealsStore((s) => s.isSaving)
  const cancelOrder = useMealsStore((s) => s.cancelOrder)
  const [reason, setReason] = useState('')

  const submit = () => cancelOrder(order.id, reason.trim() || undefined).then(onClose).catch(() => undefined)

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Скасувати замовлення</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Typography>
          {order.child.lastName} {order.child.firstName}, {formatDay(order.date)}: {order.complex.name}, {order.price} грн
        </Typography>
        <TextField label="Причина" value={reason} onChange={(e) => setReason(e.target.value)} helperText="Після дедлайну причина обов'язкова" />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Назад</Button>
          <Button onClick={submit} color="error" variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Скасувати замовлення</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
