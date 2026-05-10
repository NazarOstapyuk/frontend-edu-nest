export type UserRole = 'teacher' | 'parent'

export interface User {
  id: string
  firstName: string
  lastName: string
  role: UserRole
  login: string
  createdAt: string
}

export const roleLabels: Record<UserRole, string> = {
  teacher: 'Педагог',
  parent:  'Батьки',
}
