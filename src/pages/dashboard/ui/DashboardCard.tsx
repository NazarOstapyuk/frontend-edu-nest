import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { brandColors } from '../../../shared/assets/brand'

interface DashboardCardProps {
  to: string
  title: string
  icon: SvgIconComponent
  value: string
  children?: ReactNode
}

export const DashboardCard = ({ to, title, icon: Icon, value, children }: DashboardCardProps) => (
  <Paper
    component={RouterLink}
    to={to}
    elevation={0}
    sx={{
      p: 3,
      height: '100%',
      display: 'block',
      borderRadius: '20px',
      boxShadow: brandColors.outline,
      textDecoration: 'none',
      color: 'inherit',
      transition: 'background-color .2s',
      '&:hover': { bgcolor: brandColors.hoverRow },
      '&:focus-visible': { outline: `2px solid ${brandColors.orange}`, outlineOffset: 2 },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: brandColors.oliveTint,
          color: brandColors.inkOnOliveSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
    </Box>
    <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1.15, mb: 1 }}>{value}</Typography>
    {children}
  </Paper>
)
