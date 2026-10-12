import type { AbsenceReason, MonthCell } from '../../../shared/api'

export interface CellView {
  code: string
  color: string
  bg: string
}

export const cellView = (cell: MonthCell, reasons: Map<string, AbsenceReason>, today: string): CellView => {
  if (cell.state === 'non_working') return { code: '—', color: 'text.disabled', bg: 'grey.100' }
  if (cell.state === 'unmarked' && cell.date > today) return { code: '', color: 'text.secondary', bg: 'transparent' }
  if (cell.state === 'unmarked') return { code: '?', color: 'text.secondary', bg: 'transparent' }
  if (cell.state === 'expected_absent') return { code: '(В)', color: 'warning.dark', bg: 'transparent' }
  if (cell.state === 'absent') {
    const excused = cell.reasonId !== null && reasons.get(cell.reasonId)?.excused === true
    return excused ? { code: 'В', color: 'warning.dark', bg: 'rgba(237, 108, 2, 0.12)' } : { code: 'В*', color: 'error.main', bg: 'rgba(211, 47, 47, 0.12)' }
  }
  if (cell.status === 'late') return { code: 'З', color: 'success.dark', bg: 'rgba(46, 125, 50, 0.12)' }
  if (cell.status === 'left_early') return { code: 'Р', color: 'success.dark', bg: 'rgba(46, 125, 50, 0.12)' }
  return { code: 'П', color: 'success.dark', bg: 'rgba(46, 125, 50, 0.12)' }
}

export const legend = 'П присутній · З запізнився · Р пішов раніше · В поважна відсутність · В* без поважної причини · (В) повідомили батьки · ? не відмічено · — неробочий'
