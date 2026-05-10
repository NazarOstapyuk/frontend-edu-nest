import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuthStore } from '../../entities/user'

export const RequireAuth = () => {
  const profile = useAuthStore((s) => s.profile)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  useEffect(() => {
    if (!isInitialized) fetchMe()
  }, [isInitialized, fetchMe])

  if (!isInitialized || isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!profile) return <Navigate to="/login" replace />

  return <Outlet />
}
