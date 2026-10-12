export type UserRole = 'teacher' | 'parent'

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
}

export const homePath = (profile: SessionProfile) => {
  if (profile.mustChangePassword) return '/change-password'
  return profile.role === 'parent' ? '/family' : '/'
}

export const roleLabels: Record<UserRole, string> = {
  teacher: 'Педагог',
  parent:  'Батьки',
}
