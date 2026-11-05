import { courseColorFor, sortCourses } from './courseColors'

export interface DayDishRow {
  key: string
  title: string
  names: string[]
}

type CourseRef = { id: string; name: string; sortOrder: number }

export const groupDishesByCourse = (
  dishes: { name: string; course: CourseRef }[],
): DayDishRow[] => {
  const rows = new Map<string, DayDishRow & { sortOrder: number }>()
  for (const d of dishes) {
    const row = rows.get(d.course.id) ?? { key: d.course.id, title: d.course.name, names: [], sortOrder: d.course.sortOrder }
    row.names.push(d.name)
    rows.set(d.course.id, row)
  }
  return [...rows.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'uk'))
}

export interface CourseRow {
  id: string
  name: string
  dot: string
  text: string
}

export const courseRowsFor = (refs: CourseRef[], allCourses: CourseRef[]): CourseRow[] => {
  const unique = new Map<string, CourseRef>()
  for (const ref of refs) if (!unique.has(ref.id)) unique.set(ref.id, ref)
  const palette = allCourses.length > 0 ? allCourses : [...unique.values()]
  return sortCourses([...unique.values()]).map((c) => ({ id: c.id, name: c.name, ...courseColorFor(palette, c.id) }))
}
