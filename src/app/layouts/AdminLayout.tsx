import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar } from '@mui/material'
import { Sidebar, SIDEBAR_WIDTH } from '../../widgets/sidebar'
import { Header } from '../../widgets/header'
import { Notifier } from '../../shared/ui/Notifier'
import { useInstitutionStore } from '../../shared/model/institutionStore'

export const AdminLayout = () => {
  const institutionId = useInstitutionStore((s) => s.selectedId)
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

    <Box
      component="main"
      sx={{
        flex: 1,
        width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Header onMenuClick={() => setMobileOpen(true)} />
      <Toolbar />

      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 3 } }}>
        <Outlet key={institutionId ?? 'all'} />
      </Box>
    </Box>

    <Notifier />
  </Box>
  )
}
