import { isoWeekdayLabels, type MealComplex, type MenuDayView } from '../../../shared/api'
import { formatDay } from '../../../shared/lib/date'

export type MenuDayState = 'off' | 'empty' | 'draft' | 'published'

export const dayState = (day: MenuDayView): MenuDayState => {
  if (!day.working) return 'off'
  if (!day.menu) return 'empty'
  return day.menu.status === 'published' ? 'published' : 'draft'
}

export const weekdayNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота', 'Неділя']

export const longDate = (iso: string) => formatDay(iso.slice(0, 10))

export const shortDate = (iso: string) => formatDay(iso.slice(0, 10))

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

export const weekdayShortNames = isoWeekdayLabels

export const plural = (n: number, forms: [string, string, string]) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return forms[0]
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1]
  return forms[2]
}

export const ordersWord = (n: number) => plural(n, ['замовлення', 'замовлення', 'замовлень'])

export const ordersLabel = (n: number) => `${n} ${ordersWord(n)}`

export const rangeLabel = (from: string, to: string) =>
  `${longDate(from)} – ${longDate(to)}`

export const itemsSignature = (items: { week: number; weekday: number; dishId: string }[]) =>
  items.map((i) => `${i.week}/${i.weekday}/${i.dishId}`).sort().join(',')
