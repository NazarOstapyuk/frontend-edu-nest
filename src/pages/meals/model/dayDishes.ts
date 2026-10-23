export interface DayDishRow {
  key: string
  title: string
  names: string[]
}

export const groupDishesByCourse = (
  dishes: { name: string; course: { id: string; name: string; sortOrder: number } }[],
): DayDishRow[] => {
  const rows = new Map<string, DayDishRow & { sortOrder: number }>()
  for (const d of dishes) {
    const row = rows.get(d.course.id) ?? { key: d.course.id, title: d.course.name, names: [], sortOrder: d.course.sortOrder }
    row.names.push(d.name)
    rows.set(d.course.id, row)
  }
  return [...rows.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'uk'))
}
