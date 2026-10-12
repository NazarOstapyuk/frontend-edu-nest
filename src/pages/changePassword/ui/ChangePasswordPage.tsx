import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import { homePath, useAuthStore } from '../../../entities/user'
import { PasswordFields } from '../../../shared/ui/PasswordFields'
import { Notifier } from '../../../shared/ui/Notifier'

export const ChangePasswordPage = () => {
  const changePassword = useAuthStore((s) => s.changePassword)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
      .catch(() => undefined)
      .finally(() => navigate('/login', { replace: true }))
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', p: { xs: 3, sm: '40px 36px' }, width: '100%', maxWidth: 420 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Змініть пароль
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Пароль видав адміністратор. Задайте свій, щоб продовжити.
        </Typography>
        <PasswordFields
          submitLabel="Зберегти пароль"
          onSubmit={async (current, next) => {
            const profile = await changePassword(current, next)
            navigate(homePath(profile), { replace: true })
          }}
        />
        <Button variant="text" onClick={handleLogout} sx={{ mt: 1 }}>
          Вийти
        </Button>
      </Box>
      <Notifier />
    </Box>
  )
}
