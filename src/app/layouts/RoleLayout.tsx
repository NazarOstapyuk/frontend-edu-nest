import { useAuthStore } from '../../entities/user'
import { AdminLayout } from './AdminLayout'
import { ParentLayout } from './ParentLayout'

export const RoleLayout = () => {
  const role = useAuthStore((s) => s.profile?.role)
  return role === 'parent' ? <ParentLayout /> : <AdminLayout />
}
