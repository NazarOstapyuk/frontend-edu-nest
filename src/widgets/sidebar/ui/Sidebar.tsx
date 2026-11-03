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
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { navItems, bottomNavItems } from '../model/nav-items'
import type { NavItem } from '../model/nav-items'
import { canAccess, useAuthStore } from '../../../entities/user'
import type { SessionRole } from '../../../entities/user'
import { usePendingNoticesStore } from '../../../shared/model/pendingNoticesStore'
import { BRAND_NAME, brandColors, logoUrl, mascotHeadUrl } from '../../../shared/assets/brand'

export const SIDEBAR_WIDTH = 240

const NavButton = ({ item }: { item: NavItem }) => {
  const pending = usePendingNoticesStore((s) => s.count)
  return (
  <NavLink to={item.path} end={item.path === '/'} style={{ textDecoration: 'none' }}>
    {({ isActive }) => (
      <ListItemButton
        selected={isActive}
        sx={{
          color: isActive ? brandColors.inkOnOrange : 'rgba(255,255,255,0.78)',
          backgroundColor: isActive ? `${brandColors.orange} !important` : 'transparent',
          '&:hover': {
            backgroundColor: isActive ? brandColors.orange : 'rgba(255,255,255,0.08)',
            color: isActive ? brandColors.inkOnOrange : '#fff',
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
          slotProps={{ primary: { sx: { fontSize: 14, fontWeight: isActive ? 800 : 500 } } }}
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
          backgroundColor: brandColors.oliveDeep,
          color: '#fff',
          border: 'none',
        },
      }}
    >
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: '18px',
            pl: 1,
            pr: 1.5,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box component="img" src={mascotHeadUrl} alt="" sx={{ width: 48, height: 48, flexShrink: 0 }} />
          <Box component="img" src={logoUrl} alt={BRAND_NAME} sx={{ flex: 1, minWidth: 0, display: 'block' }} />
        </Box>
      </Box>

      <List sx={{ flex: 1, pt: 0.5 }}>
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
