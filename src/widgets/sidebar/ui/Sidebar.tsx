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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { navItems, bottomNavItems, navSectionLabels } from '../model/nav-items'
import type { NavItem, NavSection } from '../model/nav-items'
import { canAccess, useAuthStore } from '../../../entities/user'
import type { SessionRole } from '../../../entities/user'
import { usePendingNoticesStore } from '../../../shared/model/pendingNoticesStore'
import { usePendingNotesStore } from '../../../shared/model/pendingNotesStore'
import { usePendingTasksStore } from '../../../shared/model/pendingTasksStore'
import { BRAND_NAME, brandColors, logoUrl, mascotHeadUrl } from '../../../shared/assets/brand'

export const SIDEBAR_WIDTH = 240

const NavButton = ({ item }: { item: NavItem }) => {
  const pendingNotices = usePendingNoticesStore((s) => s.count)
  const pendingNotes = usePendingNotesStore((s) => s.count)
  const openTasks = usePendingTasksStore((s) => s.open)
  const overdueTasks = usePendingTasksStore((s) => s.overdue)
  const pending =
    item.badge === 'pendingNotices'
      ? pendingNotices
      : item.badge === 'pendingNotes'
        ? pendingNotes
        : item.badge === 'pendingTasks'
          ? openTasks
          : 0
  const badgeColor = item.badge === 'pendingTasks' && overdueTasks > 0 ? 'warning' : 'primary'
  return (
  <NavLink to={item.path} end={item.path === '/'} style={{ textDecoration: 'none' }}>
    {({ isActive }) => (
      <ListItemButton
        selected={isActive}
        sx={{
          minHeight: 42,
          py: 0,
          my: 0.25,
          color: isActive ? brandColors.ink : brandColors.navInk,
          backgroundColor: isActive ? `${brandColors.surface} !important` : 'transparent',
          boxShadow: isActive ? '0 1px 2px rgba(34,35,28,.06), 0 0 0 1px rgba(34,35,28,.05)' : 'none',
          '&:hover': {
            backgroundColor: isActive ? brandColors.surface : brandColors.navHover,
          },
          '&.Mui-focusVisible': {
            outline: `2px solid ${brandColors.orange}`,
            outlineOffset: 1,
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isActive ? brandColors.navIcon : 'inherit' }}>
          {pending > 0 ? (
            <Badge badgeContent={pending} color={badgeColor} sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}><item.icon fontSize="small" /></Badge>
          ) : (
            <item.icon fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{ primary: { sx: { fontSize: 14, fontWeight: isActive ? 800 : 600 } } }}
        />
      </ListItemButton>
    )}
  </NavLink>
  )
}

const sectionOrder: (NavSection | undefined)[] = [undefined, 'people', 'classes', 'money']

const NavGroup = ({ title, items }: { title?: string; items: NavItem[] }) => {
  if (items.length === 0) return null
  return (
    <Box sx={{ mb: 1 }}>
      {title && (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: brandColors.label, px: 2.5, pt: 1.5, pb: 0.5 }}>
          {title}
        </Typography>
      )}
      <List disablePadding>
        {items.map(item => (
          <NavButton key={item.path} item={item} />
        ))}
      </List>
    </Box>
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
  const canSeeNotes = canSeeRegister || role === 'teacher'
  const refreshPendingNotes = usePendingNotesStore((s) => s.refresh)
  useEffect(() => {
    if (canSeeNotes) refreshPendingNotes().catch(() => undefined)
  }, [canSeeNotes, refreshPendingNotes])
  const canSeeTasks = role === 'root' || role === 'admin' || role === 'teacher'
  const refreshPendingTasks = usePendingTasksStore((s) => s.refresh)
  useEffect(() => {
    if (canSeeTasks) refreshPendingTasks().catch(() => undefined)
  }, [canSeeTasks, refreshPendingTasks])
  useEffect(() => {
    if (!isNarrow) onClose()
  }, [isNarrow, onClose])
  const visible = (item: NavItem) =>
    (!item.roles && !item.area && !item.areas) ||
    (role !== undefined && !!item.roles?.includes(role)) ||
    (!!item.area && canAccess(profile, item.area, 'view')) ||
    !!item.areas?.some((a) => canAccess(profile, a, 'view'))

  const visibleItems = navItems.filter(visible)

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
          backgroundColor: brandColors.ground,
          color: brandColors.ink,
          border: 'none',
          boxShadow: 'none',
          overflowY: 'auto',
        },
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="img" src={mascotHeadUrl} alt="" sx={{ width: 44, height: 44, flexShrink: 0 }} />
        <Box component="img" src={logoUrl} alt={BRAND_NAME} sx={{ width: 140, minWidth: 0, display: 'block' }} />
      </Box>

      <Box sx={{ flex: 1 }}>
        {sectionOrder.map(section => (
          <NavGroup
            key={section ?? 'main'}
            title={section ? navSectionLabels[section] : undefined}
            items={visibleItems.filter(item => item.section === section)}
          />
        ))}
      </Box>

      <Box sx={{ pb: 1 }}>
        <NavGroup title={navSectionLabels.settings} items={bottomNavItems.filter(visible)} />
      </Box>
    </Drawer>
  )
}
