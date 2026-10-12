import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { useAuthStore } from '../../entities/user'
import { Notifier } from '../../shared/ui/Notifier'

export const ParentLayout = () => {
  const profile = useAuthStore((s) => s.profile)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout().catch(() => undefined)
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#fff', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mr: 'auto' }}>
            EduNest
          </Typography>
          <Button component={NavLink} to="/family" color="inherit">
            Моя сім'я
          </Button>
          <Button component={NavLink} to="/profile" color="inherit">
            {profile ? `${profile.firstName} ${profile.lastName}` : 'Профіль'}
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Вийти
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Outlet />
      </Box>
      <Notifier />
    </Box>
  )
}
