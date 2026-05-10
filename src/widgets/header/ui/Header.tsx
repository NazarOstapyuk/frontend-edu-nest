import { useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Badge,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { SIDEBAR_WIDTH } from '../../sidebar/ui/Sidebar'

const pageTitles: Record<string, string> = {
  '/':          'Дашборд',
  '/users':     'Користувачі',
  '/students':  'Учні',
  '/teachers':  'Вчителі',
  '/classes':   'Класи',
  '/schedule':  'Розклад',
  '/grades':    'Оцінки',
  '/reports':   'Звіти',
  '/settings':  'Налаштування',
}

export const Header = () => {
  const { pathname } = useLocation()

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              АД
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Адміністратор
              </Typography>
              <Typography variant="caption" color="text.secondary">
                admin@school.ua
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
