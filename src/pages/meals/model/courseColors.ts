import { brandColors } from '../../../shared/assets/brand'

const palette = [
  { dot: '#5c6bc0', text: '#3949ab' },
  { dot: '#26a69a', text: '#00796b' },
  { dot: '#ef6c00', text: '#d84315' },
  { dot: '#ab47bc', text: '#7b1fa2' },
  { dot: '#8d6e63', text: '#5d4037' },
  { dot: '#29b6f6', text: '#0277bd' },
  { dot: '#9ccc65', text: '#558b2f' },
  { dot: '#ec407a', text: '#c2185b' },
]

export const courseColorAt = (index: number) => palette[((index % palette.length) + palette.length) % palette.length]

export const sortCourses = <T extends { sortOrder: number; name: string }>(list: T[]) =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk'))

export const courseColorFor = (courses: { id: string; sortOrder: number; name: string }[], id: string) =>
  courseColorAt(Math.max(0, sortCourses(courses).findIndex((c) => c.id === id)))

export const hatchedBackground = `repeating-linear-gradient(135deg, ${brandColors.ground} 0 6px, ${brandColors.surface} 6px 12px)`
