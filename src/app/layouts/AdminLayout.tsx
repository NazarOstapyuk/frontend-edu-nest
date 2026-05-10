import { Outlet } from 'react-router-dom'
import { Box, Toolbar } from '@mui/material'
import { Sidebar, SIDEBAR_WIDTH } from '../../widgets/sidebar'
import { Header } from '../../widgets/header'

export const AdminLayout = () => (
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
        <Outlet />
      </Box>
    </Box>
  </Box>
)
