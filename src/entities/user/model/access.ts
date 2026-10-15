import { levelSatisfies, type PermissionArea, type PermissionLevel } from '../../../shared/api'
import type { SessionProfile } from './types'
import { useAuthStore } from './authStore'

export const canAccess = (
  profile: SessionProfile | null,
  area: PermissionArea,
  level: PermissionLevel,
): boolean => {
  if (!profile) return false
  if (profile.role === 'root') return true
  return levelSatisfies(profile.permissions?.[area], level)
}

export const useCan = (area: PermissionArea, level: PermissionLevel): boolean =>
  useAuthStore((s) => canAccess(s.profile, area, level))
