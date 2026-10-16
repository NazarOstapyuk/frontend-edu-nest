import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'

interface DashboardCardProps {
  to: string
  title: string
  icon: SvgIconComponent
  alert: boolean
  children?: ReactNode
}

export const DashboardCard = ({ to, title, icon: Icon, alert, children }: DashboardCardProps) => {
  const tone = alert ? { color: '#e65100', bg: '#fff3e0' } : { color: '#2e7d32', bg: '#e8f5e9' }
  return (
    <Paper
      component={RouterLink}
      to={to}
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow .2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: tone.bg,
          color: tone.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {children}
      </Box>
    </Paper>
  )
}
