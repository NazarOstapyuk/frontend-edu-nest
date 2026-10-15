import type { AccessScope, PermissionItem, PermissionMap } from '../../../shared/api'

export type UserRole = 'admin' | 'teacher' | 'parent'

export type SessionRole = 'root' | 'admin' | 'teacher' | 'parent'

export interface User {
  id: string
  firstName: string
  lastName: string
  role: UserRole
  login: string
  createdAt: string
  middleName?: string | null
  phone?: string | null
  email?: string | null
  mustChangePassword?: boolean
  accessScope?: AccessScope
  permissions?: PermissionItem[]
}

export interface SessionProfile {
  id: string
  login: string
  role: SessionRole
  firstName: string
  lastName: string
  middleName: string | null
  phone: string | null
  email: string | null
  mustChangePassword: boolean
  accessScope: AccessScope
  permissions: PermissionMap
}

export const homePath = (profile: SessionProfile) => {
  if (profile.mustChangePassword) return '/change-password'
  return profile.role === 'parent' ? '/family' : '/'
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Адміністратор',
  teacher: 'Педагог',
  parent:  'Батьки',
}
