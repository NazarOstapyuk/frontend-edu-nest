import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../entities/user'

export const PasswordGate = () => {
  const mustChange = useAuthStore((s) => s.profile?.mustChangePassword ?? false)
  if (mustChange) return <Navigate to="/change-password" replace />
  return <Outlet />
}
