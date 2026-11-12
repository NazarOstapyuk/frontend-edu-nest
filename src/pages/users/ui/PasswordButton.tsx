import { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { usersApi } from '../../../shared/api'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import type { User } from '../../../entities/user'

export const PasswordButton = ({ user }: { user: User }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState<string | null>(null)

  const reveal = async () => {
    setIsLoading(true)
    try {
      const { data } = await usersApi.revealPassword(user.id)
      setPassword(data.password)
      setIsOpen(true)
    } catch {
      return
    } finally {
      setIsLoading(false)
    }
  }

  const close = () => {
    setIsOpen(false)
    setPassword(null)
  }

  const copy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      useNotifyStore.getState().push('Пароль скопійовано', 'success')
    } catch {
      useNotifyStore.getState().push('Не вдалося скопіювати пароль')
    }
  }

  return (
    <>
      <Tooltip title="Показати пароль">
        <span>
          <IconButton size="small" onClick={reveal} disabled={isLoading} aria-label="Показати пароль">
            {isLoading ? <CircularProgress size={16} /> : <VisibilityOutlinedIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Dialog open={isOpen} onClose={close} fullWidth maxWidth="xs">
        <DialogTitle>
          Пароль: {user.lastName} {user.firstName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Логін: <Box component="span" sx={{ fontFamily: 'monospace' }}>{user.login}</Box>
          </Typography>
          {password ? (
            <Typography sx={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, wordBreak: 'break-all' }}>
              {password}
            </Typography>
          ) : (
            <Typography color="text.secondary">
              Пароль невідомий: його задали до того, як з'явився перегляд паролів. Задайте новий пароль у «Редагувати»,
              і він стане видимим.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {password && <Button onClick={copy}>Скопіювати</Button>}
          <Button variant="contained" onClick={close}>
            Закрити
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
