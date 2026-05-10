import { NavLink } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import { navItems, bottomNavItems } from '../model/nav-items'
import type { NavItem } from '../model/nav-items'

export const SIDEBAR_WIDTH = 240

const NavButton = ({ item }: { item: NavItem }) => (
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
          <item.icon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{ primary: { fontSize: 14, fontWeight: isActive ? 600 : 400 } }}
        />
      </ListItemButton>
    )}
  </NavLink>
)

export const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
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
        {navItems.map(item => (
          <NavButton key={item.path} item={item} />
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 2 }} />

      <List sx={{ pb: 1 }}>
        {bottomNavItems.map(item => (
          <NavButton key={item.path} item={item} />
        ))}
      </List>
    </Drawer>
  )
}
