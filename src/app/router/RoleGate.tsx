import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type SessionRole } from '../../entities/user'

interface RoleGateProps {
  roles: SessionRole[]
  redirectTo: string
}

export const RoleGate = ({ roles, redirectTo }: RoleGateProps) => {
  const role = useAuthStore((s) => s.profile?.role)
  if (!role || !roles.includes(role)) return <Navigate to={redirectTo} replace />
  return <Outlet />
}
