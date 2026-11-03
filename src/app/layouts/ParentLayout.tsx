import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AppBar, Box, Button, IconButton, Toolbar } from '@mui/material'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuthStore } from '../../entities/user'
import { useIsPhone } from '../../shared/lib/useIsPhone'
import { Notifier } from '../../shared/ui/Notifier'
import { BRAND_NAME, logoUrl, mascotHeadUrl } from '../../shared/assets/brand'

export const ParentLayout = () => {
  const profile = useAuthStore((s) => s.profile)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const isPhone = useIsPhone()

  const handleLogout = async () => {
    await logout().catch(() => undefined)
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Box
            component={NavLink}
            to="/family"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto', py: 0.5 }}
          >
            <Box component="img" src={mascotHeadUrl} alt="" sx={{ width: 40, height: 40 }} />
            <Box component="img" src={logoUrl} alt={BRAND_NAME} sx={{ width: 120, display: 'block' }} />
          </Box>
          {isPhone ? (
            <>
              <IconButton component={NavLink} to="/family" color="inherit" aria-label="Моя сім'я">
                <FamilyRestroomIcon />
              </IconButton>
              <IconButton component={NavLink} to="/profile" color="inherit" aria-label="Профіль">
                <PersonIcon />
              </IconButton>
              <IconButton color="inherit" onClick={handleLogout} aria-label="Вийти">
                <LogoutIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Button component={NavLink} to="/family" color="inherit">
                Моя сім'я
              </Button>
              <Button component={NavLink} to="/profile" color="inherit">
                {profile ? `${profile.firstName} ${profile.lastName}` : 'Профіль'}
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Вийти
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Outlet />
      </Box>
      <Notifier />
    </Box>
  )
}
