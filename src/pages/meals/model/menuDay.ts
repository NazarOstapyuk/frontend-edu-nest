import type { MealComplex, MenuDayView } from '../../../shared/api'

export type MenuDayState = 'off' | 'empty' | 'draft' | 'published'

export const dayState = (day: MenuDayView): MenuDayState => {
  if (!day.working) return 'off'
  if (!day.menu) return 'empty'
  return day.menu.status === 'published' ? 'published' : 'draft'
}

export const weekdayNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота', 'Неділя']

export const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' })

export const shortDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export interface ComplexAvailability {
  id: string
  name: string
  missing: string[]
}

export const availabilityFor = (courseIds: Iterable<string>, complexes: MealComplex[]): ComplexAvailability[] => {
  const present = new Set(courseIds)
  return complexes
    .filter((c) => c.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk'))
    .map((c) => ({ id: c.id, name: c.name, missing: c.courses.filter((course) => !present.has(course.id)).map((course) => course.name) }))
}

export const complexAvailability = (day: MenuDayView, complexes: MealComplex[]): ComplexAvailability[] =>
  availabilityFor((day.menu?.dishes ?? []).map((d) => d.course.id), complexes)

export interface WeekSummary {
  working: number
  filled: number
  published: number
  orders: number
  states: MenuDayState[]
}

export const weekSummary = (days: MenuDayView[]): WeekSummary => {
  const states = days.map(dayState)
  return {
    working: states.filter((s) => s !== 'off').length,
    filled: states.filter((s) => s === 'draft' || s === 'published').length,
    published: states.filter((s) => s === 'published').length,
    orders: days.reduce((sum, d) => sum + (d.menu?.activeOrders ?? 0), 0),
    states,
  }
}
