import type { CashAlertView } from '../../../shared/api'

export const cashAlertLink = (alert: CashAlertView) =>
  alert.shiftId ? `/cash?tab=shifts&shift=${alert.shiftId}` : '/cash'
