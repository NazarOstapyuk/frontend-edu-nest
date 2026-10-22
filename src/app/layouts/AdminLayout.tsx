import { Outlet } from 'react-router-dom'
import { Box, Toolbar } from '@mui/material'
import { Sidebar, SIDEBAR_WIDTH } from '../../widgets/sidebar'
import { Header } from '../../widgets/header'
import { Notifier } from '../../shared/ui/Notifier'
import { useInstitutionStore } from '../../shared/model/institutionStore'

export const AdminLayout = () => {
  const institutionId = useInstitutionStore((s) => s.selectedId)
  return (
  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />

    <Box
      component="main"
      sx={{
        flex: 1,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Header />
      <Toolbar />

      <Box sx={{ flex: 1, p: 3 }}>
        <Outlet key={institutionId ?? 'all'} />
      </Box>
    </Box>

    <Notifier />
  </Box>
  )
}
