import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useIsPhone } from '../lib/useIsPhone'

interface ConfirmDialogProps {
  open: boolean
  title: string
  text?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'primary'
  onConfirm: () => unknown
  onClose: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  text,
  confirmLabel = 'Видалити',
  cancelLabel = 'Скасувати',
  color = 'error',
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  const isPhone = useIsPhone()
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    await Promise.resolve(onConfirm()).catch(() => undefined)
    setBusy(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      {text && (
        <DialogContent>
          <DialogContentText>{text}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant="contained" color={color} onClick={confirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
