import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Badge,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import { navItems, bottomNavItems } from '../model/nav-items'
import type { NavItem } from '../model/nav-items'
import { canAccess, useAuthStore } from '../../../entities/user'
import type { SessionRole } from '../../../entities/user'
import { usePendingNoticesStore } from '../../../shared/model/pendingNoticesStore'

export const SIDEBAR_WIDTH = 240

const NavButton = ({ item }: { item: NavItem }) => {
  const pending = usePendingNoticesStore((s) => s.count)
  return (
  <NavLink to={item.path} end={item.path === '/'} style={{ textDecoration: 'none' }}>
    {({ isActive }) => (
      <ListItemButton
        selected={isActive}
        sx={{
          color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
          backgroundColor: isActive ? 'rgba(255,255,255,0.15) !important' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: '#fff',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
          {item.badge === 'pendingNotices' && pending > 0 ? (
            <Badge badgeContent={pending} color="error"><item.icon fontSize="small" /></Badge>
          ) : (
            <item.icon fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{ primary: { sx: { fontSize: 14, fontWeight: isActive ? 600 : 400 } } }}
        />
      </ListItemButton>
    )}
  </NavLink>
  )
}

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
  const profile = useAuthStore((s) => s.profile)
  const role = profile?.role as SessionRole | undefined
  const canSeeRegister = canAccess(profile, 'register', 'view')
  const refreshPending = usePendingNoticesStore((s) => s.refresh)
  useEffect(() => {
    if (canSeeRegister) refreshPending().catch(() => undefined)
  }, [canSeeRegister, refreshPending])
  useEffect(() => {
    if (!isNarrow) onClose()
  }, [isNarrow, onClose])
  const visible = (item: NavItem) =>
    (!item.roles && !item.area && !item.areas) ||
    (role !== undefined && !!item.roles?.includes(role)) ||
    (!!item.area && canAccess(profile, item.area, 'view')) ||
    !!item.areas?.some((a) => canAccess(profile, a, 'view'))

  return (
    <Drawer
      variant={isNarrow ? 'temporary' : 'permanent'}
      open={isNarrow ? mobileOpen : true}
      onClose={onClose}
      onClick={isNarrow ? onClose : undefined}
      sx={{
        width: isNarrow ? 'auto' : SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
          color: '#fff',
          border: 'none',
        },
      }}
    >
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SchoolIcon sx={{ fontSize: 28, color: '#90caf9' }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
          EduNest
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 2 }} />

      <List sx={{ flex: 1, pt: 1.5 }}>
        {navItems.filter(visible).map(item => (
          <NavButton key={item.path} item={item} />
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 2 }} />

      <List sx={{ pb: 1 }}>
        {bottomNavItems.filter(visible).map(item => (
          <NavButton key={item.path} item={item} />
        ))}
      </List>
    </Drawer>
  )
}
