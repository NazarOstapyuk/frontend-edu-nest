import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Avatar, Box, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import { useAuthStore } from '../../../entities/user'
import { SIDEBAR_WIDTH } from '../../sidebar/ui/Sidebar'
import { InstitutionSwitcher } from './InstitutionSwitcher'

const pageTitles: Record<string, string> = {
  '/':          'Сьогодні',
  '/register':  'Журнал',
  '/users':     'Користувачі',
  '/groups':    'Групи',
  '/students':  'Учні',
  '/finance':   'Фінанси',
  '/tariffs':   'Тарифи',
  '/teachers':  'Вчителі',
  '/classes':   'Гуртки',
  '/my-classes': 'Мої заняття',
  '/my-lessons': 'Мої уроки',
  '/calendar':  'Календар',
  '/schedule-setup': 'Довідники розкладу',
  '/absence-notices': 'Повідомлення про відсутність',
  '/absence-reasons': 'Причини відсутності',
  '/profile':   'Профіль',
  '/schedule':  'Розклад',
  '/grades':    'Оцінки',
  '/reports':   'Звіти',
  '/settings':  'Налаштування',
}

const roleCaption = { root: 'Адміністратор', admin: 'Адміністратор', teacher: 'Педагог', parent: 'Батьки' } as const

export const Header = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const logout = useAuthStore((s) => s.logout)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const go = (path: string) => {
    setAnchor(null)
    navigate(path)
  }

  const handleLogout = async () => {
    setAnchor(null)
    await logout().catch(() => undefined)
    navigate('/login')
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        ml: `${SIDEBAR_WIDTH}px`,
        backgroundColor: '#fff',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, color: 'text.primary' }}>
          {pageTitles[pathname] ?? 'EduNest'}
        </Typography>

        {profile && profile.role !== 'parent' && <InstitutionSwitcher />}

        {profile && (
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={(e) => setAnchor(e.currentTarget)}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {`${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {profile.lastName} {profile.firstName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {roleCaption[profile.role]}
              </Typography>
            </Box>
          </Box>
        )}
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => go('/profile')}>Профіль</MenuItem>
          <MenuItem onClick={handleLogout}>Вийти</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
