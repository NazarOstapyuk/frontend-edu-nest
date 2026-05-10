import { Grid, Paper, Typography, Box } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import SchoolIcon from '@mui/icons-material/School'
import ClassIcon from '@mui/icons-material/Class'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import BarChartIcon from '@mui/icons-material/BarChart'

const stats = [
  { label: 'Учнів',       value: '245',  icon: PeopleIcon,       color: '#1565c0', bg: '#e3f2fd' },
  { label: 'Вчителів',    value: '32',   icon: SchoolIcon,       color: '#2e7d32', bg: '#e8f5e9' },
  { label: 'Класів',      value: '18',   icon: ClassIcon,        color: '#e65100', bg: '#fff3e0' },
  { label: 'Предметів',   value: '24',   icon: AssignmentIcon,   color: '#6a1b9a', bg: '#f3e5f5' },
  { label: 'Подій',       value: '5',    icon: CalendarMonthIcon,color: '#00695c', bg: '#e0f2f1' },
  { label: 'Середній бал',value: '4.2',  icon: BarChartIcon,     color: '#c62828', bg: '#ffebee' },
]

export const DashboardPage = () => {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Загальна статистика школи
      </Typography>

      <Grid container spacing={2.5}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'box-shadow .2s',
                '&:hover': { boxShadow: 3 },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ color, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
