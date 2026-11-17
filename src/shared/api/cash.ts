import { axiosInstance } from './axiosInstance';
import type { FinanceCategory } from './finance';

export type CashDirection = 'kindergarten' | 'school' | 'shared';
export type CashEntryKind = 'income' | 'expense' | 'transfer' | 'correction';
export type CashExpenseCategory = 'household' | 'materials' | 'supplier' | 'refund' | 'other';
export type CashTransferStatus = 'pending' | 'confirmed' | 'disputed';
export type CashAlertType =
  | 'shift_closed'
  | 'discrepancy'
  | 'opening_discrepancy'
  | 'large_withdrawal'
  | 'payment_void'
  | 'correction'
  | 'transfer_disputed';

export const cashDirectionLabels: Record<CashDirection, string> = {
  kindergarten: 'Садок',
  school: 'Школа',
  shared: 'Спільне',
};

export const cashEntryKindLabels: Record<CashEntryKind, string> = {
  income: 'Надходження',
  expense: 'Видаток',
  transfer: 'Передача',
  correction: 'Коригування',
};

export const cashExpenseCategoryLabels: Record<CashExpenseCategory, string> = {
  household: 'Господарські потреби',
  materials: 'Закупівля матеріалів',
  supplier: 'Оплата постачальнику',
  refund: 'Повернення коштів батькам',
  other: 'Інші витрати',
};

export const cashTransferStatusLabels: Record<CashTransferStatus, string> = {
  pending: 'Очікує отримання',
  confirmed: 'Отримано',
  disputed: 'Не отримано',
};

export const cashAlertTypeLabels: Record<CashAlertType, string> = {
  shift_closed: 'Зміну закрито',
  discrepancy: 'Нестача або надлишок',
  opening_discrepancy: 'Розбіжність при прийомі каси',
  large_withdrawal: 'Видача великої суми',
  payment_void: 'Скасування оплати',
  correction: 'Коригування каси',
  transfer_disputed: 'Кошти не отримано',
};

export const DENOMINATIONS = [
  '100000',
  '50000',
  '20000',
  '10000',
  '5000',
  '2000',
  '1000',
  '500',
  '200',
  '100',
  '50',
  '10',
] as const;

export const denominationLabel = (key: string): string => {
  const kopecks = Number(key);
  return kopecks >= 100 ? `${kopecks / 100} грн` : `${kopecks} коп.`;
};

export interface Person {
  id: string;
  name: string;
}

interface CashKindTotals {
  income: string;
  expense: string;
  transfer: string;
  correction: string;
}

export interface CashTotals extends CashKindTotals {
  byDirection: Record<CashDirection, CashKindTotals>;
}

export interface CashDeskState {
  id: string;
  name: string;
  isActive: boolean;
  largeAmount: string;
  closeBy: string;
  openShift: {
    id: string;
    openedAt: string;
    openedBy: Person;
    openingCounted: string;
    totals: CashTotals;
    expected: string;
  } | null;
  lastClosed: {
    id: string;
    closedAt: string;
    closedBy: Person;
    closingExpected: string;
    closingCounted: string;
    difference: string;
  } | null;
}

export interface CashShiftView {
  id: string;
  deskId: string;
  deskName: string;
  openedAt: string;
  openedBy: Person;
  openingExpected: string;
  openingCounted: string;
  openingNote: string | null;
  closedAt: string | null;
  closedBy: Person | null;
  closingExpected: string | null;
  closingCounted: string | null;
  closingNote: string | null;
  denominations: Record<string, number>;
  totals: CashTotals;
  expected: string;
  difference: string | null;
}

export interface CashEntryView {
  id: string;
  shiftId: string;
  kind: CashEntryKind;
  amount: string;
  sign: number;
  direction: CashDirection;
  expenseCategory: CashExpenseCategory | null;
  comment: string | null;
  createdAt: string;
  createdBy: Person;
  voidedAt: string | null;
  voidedBy: Person | null;
  voidReason: string | null;
  correctsId: string | null;
  transfer: {
    recipient: Person;
    status: CashTransferStatus | null;
    note: string | null;
    confirmedAt: string | null;
  } | null;
  payment: {
    id: string;
    method: string;
    category: FinanceCategory | null;
    payerName: string | null;
    periodFrom: string | null;
    periodTo: string | null;
    child: Person;
    group: { id: string; name: string } | null;
  } | null;
}

export interface CashShiftReport {
  shift: CashShiftView;
  entries: CashEntryView[];
}

export interface CashAlertView {
  id: string;
  type: CashAlertType;
  deskId: string;
  deskName: string;
  shiftId: string | null;
  entryId: string | null;
  amount: string | null;
  actor: Person | null;
  createdAt: string;
  acknowledgedAt: string | null;
}

export interface UnclosedShiftView {
  deskId: string;
  deskName: string;
  shiftId: string;
  openedAt: string;
  openedBy: Person;
}

export interface CreateCashDeskDto {
  name: string;
  largeAmount: string;
  closeBy: string;
}

export interface UpdateCashDeskDto {
  name?: string;
  largeAmount?: string;
  closeBy?: string;
  isActive?: boolean;
}

export interface CashCountDto {
  denominations: Record<string, number>;
  note?: string;
}

export interface CashShiftsQuery {
  deskId?: string;
  from?: string;
  to?: string;
  userId?: string;
}

export interface CreateCashEntryDto {
  kind: 'expense' | 'transfer';
  amount: string;
  direction?: CashDirection;
  expenseCategory?: CashExpenseCategory;
  recipientId?: string;
  comment?: string;
}

export interface CreateCashCorrectionDto {
  sign: 1 | -1;
  amount: string;
  direction?: CashDirection;
  comment: string;
  correctsId?: string;
}

const allParams = (all?: boolean) => (all ? { all: 1 } : undefined);

export const cashApi = {
  getDesks: (all?: boolean) =>
    axiosInstance
      .get<CashDeskState[]>('/cash/desks', { params: allParams(all) })
      .then((response) => response.data),
  createDesk: (dto: CreateCashDeskDto) =>
    axiosInstance.post<CashDeskState>('/cash/desks', dto).then((response) => response.data),
  updateDesk: (id: string, dto: UpdateCashDeskDto) =>
    axiosInstance.patch<CashDeskState>(`/cash/desks/${id}`, dto).then((response) => response.data),
  openShift: (deskId: string, dto: CashCountDto) =>
    axiosInstance
      .post<CashShiftReport>(`/cash/desks/${deskId}/shifts`, dto)
      .then((response) => response.data),
  closeShift: (shiftId: string, dto: CashCountDto) =>
    axiosInstance
      .post<CashShiftReport>(`/cash/shifts/${shiftId}/close`, dto)
      .then((response) => response.data),
  getShifts: (query: CashShiftsQuery) =>
    axiosInstance
      .get<CashShiftView[]>('/cash/shifts', { params: query })
      .then((response) => response.data),
  getShift: (id: string) =>
    axiosInstance.get<CashShiftReport>(`/cash/shifts/${id}`).then((response) => response.data),
  createEntry: (deskId: string, dto: CreateCashEntryDto) =>
    axiosInstance
      .post<CashEntryView>(`/cash/desks/${deskId}/entries`, dto)
      .then((response) => response.data),
  createCorrection: (deskId: string, dto: CreateCashCorrectionDto) =>
    axiosInstance
      .post<CashEntryView>(`/cash/desks/${deskId}/corrections`, dto)
      .then((response) => response.data),
  voidEntry: (id: string, reason: string) =>
    axiosInstance
      .post<CashEntryView>(`/cash/entries/${id}/void`, { reason })
      .then((response) => response.data),
  getRecipients: (all?: boolean) =>
    axiosInstance
      .get<Person[]>('/cash/recipients', { params: allParams(all) })
      .then((response) => response.data),
  getMyTransfers: () =>
    axiosInstance.get<CashEntryView[]>('/cash/transfers/mine').then((response) => response.data),
  confirmTransfer: (id: string) =>
    axiosInstance
      .post<CashEntryView>(`/cash/entries/${id}/confirm`)
      .then((response) => response.data),
  disputeTransfer: (id: string, note: string) =>
    axiosInstance
      .post<CashEntryView>(`/cash/entries/${id}/dispute`, { note })
      .then((response) => response.data),
  getAlerts: (all?: boolean) =>
    axiosInstance
      .get<CashAlertView[]>('/cash/alerts', { params: allParams(all) })
      .then((response) => response.data),
  getAlertCount: () =>
    axiosInstance.get<{ count: number }>('/cash/alerts/count').then((response) => response.data),
  ackAlert: (id: string) =>
    axiosInstance
      .post<{ updated: number }>(`/cash/alerts/${id}/ack`)
      .then((response) => response.data),
  ackAll: () =>
    axiosInstance
      .post<{ updated: number }>('/cash/alerts/ack-all')
      .then((response) => response.data),
};
