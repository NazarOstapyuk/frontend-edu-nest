type DateInput = string | Date | null | undefined

const KYIV = 'Europe/Kyiv'
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/

const toDate = (value: Exclude<DateInput, null | undefined>) =>
  value instanceof Date ? value : new Date(DAY_ONLY.test(value) ? `${value}T00:00:00Z` : value)

const parts = (date: Date, timeZone: string) => {
  const map: Record<string, string> = {}
  for (const part of new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date)) {
    map[part.type] = part.value
  }
  return map
}

const format = (value: DateInput, timeZone: string, withTime: boolean) => {
  if (value === null || value === undefined || value === '') return ''
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''
  const p = parts(date, timeZone)
  const day = `${p.day}.${p.month}.${p.year}`
  return withTime ? `${day} ${p.hour}:${p.minute}` : day
}

export const formatDay = (value: DateInput) => format(value, 'UTC', false)

export const formatDate = (value: DateInput) => format(value, KYIV, false)

export const formatDateTime = (value: DateInput) => format(value, KYIV, true)
