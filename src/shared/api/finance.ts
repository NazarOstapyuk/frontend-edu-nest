import { axiosInstance } from './axiosInstance';

export type FinanceCategory = 'tuition' | 'adaptation' | 'extra_classes' | 'meals';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'online';
export type ManualPaymentMethod = Exclude<PaymentMethod, 'online'>;
export type ChargeState = 'unpaid' | 'partial' | 'paid';
export type FinanceEventType =
  | 'charge_created'
  | 'charge_voided'
  | 'payment_recorded'
  | 'payment_voided'
  | 'allocation_created'
  | 'allocation_voided';

export const financeCategoryLabels: Record<FinanceCategory, string> = {
  tuition: 'Навчання',
  adaptation: 'Адаптація',
  extra_classes: 'Додаткові заняття',
  meals: 'Харчування',
};

export const financeCategories = Object.keys(financeCategoryLabels) as FinanceCategory[];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Готівка',
  bank_transfer: 'Банківський переказ',
  online: 'Онлайн',
};

export const chargeStateLabels: Record<ChargeState, string> = {
  unpaid: 'Не оплачено',
  partial: 'Частково',
  paid: 'Оплачено',
};

export const financeEventLabels: Record<FinanceEventType, string> = {
  charge_created: 'Нарахування',
  charge_voided: 'Сторно нарахування',
  payment_recorded: 'Оплата',
  payment_voided: 'Сторно оплати',
  allocation_created: 'Розподіл',
  allocation_voided: 'Знято розподіл',
};

export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
}

interface Voidable {
  voidedAt: string | null;
  voidedBy: PersonRef | null;
  voidReason: string | null;
}

export interface FinanceCharge extends Voidable {
  id: string;
  category: FinanceCategory;
  amount: string;
  description: string;
  periodStart: string | null;
  periodEnd: string | null;
  sourceType: string;
  sourceId: string | null;
  createdAt: string;
  createdBy: PersonRef;
  paid: string;
  remaining: string;
  state: ChargeState;
}

export interface FinanceAllocation extends Voidable {
  id: string;
  paymentId: string;
  chargeId: string;
  amount: string;
  createdAt: string;
  createdBy: PersonRef;
  charge: { id: string; category: FinanceCategory; description: string; periodStart: string | null };
}

export interface FinancePayment extends Voidable {
  id: string;
  amount: string;
  category: FinanceCategory | null;
  method: PaymentMethod;
  status: 'pending' | 'confirmed' | 'failed';
  reference: string;
  receivedAt: string;
  note: string | null;
  createdAt: string;
  createdBy: PersonRef | null;
  allocated: string;
  free: string;
  allocations: FinanceAllocation[];
}

export interface CategorySummary {
  category: FinanceCategory;
  charged: string;
  paid: string;
  debt: string;
  prepayment: string;
}

export interface ChildFinance {
  child: PersonRef;
  totals: { totalDue: string; unallocated: string };
  categories: CategorySummary[];
  charges: FinanceCharge[];
  payments: FinancePayment[];
}

export interface FinanceEvent {
  type: FinanceEventType;
  at: string;
  by: PersonRef | null;
  amount: string;
  description: string;
  reason: string | null;
}

export interface SuggestionLine {
  chargeId: string;
  category: FinanceCategory;
  description: string;
  periodStart: string | null;
  createdAt: string;
  remaining: string;
  suggestedAmount: string;
}

export interface AllocationSuggestion {
  lines: SuggestionLine[];
  leftover: string;
}

export interface FinanceBalance {
  childId: string;
  firstName: string;
  lastName: string;
  totalDue: string;
  debt: string;
  prepayment: string;
  unallocated: string;
}

export interface BalancesFilters {
  category?: FinanceCategory;
  hasDebt?: 'true';
  hasUnallocated?: 'true';
}

export interface CreateChargeDto {
  category: FinanceCategory;
  amount: string;
  description: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface AllocationItem {
  chargeId: string;
  amount: string;
}

export interface CreatePaymentDto {
  amount: string;
  method: ManualPaymentMethod;
  reference: string;
  receivedAt: string;
  category?: FinanceCategory;
  note?: string;
  allocations?: AllocationItem[];
}

export interface AllocateDto {
  allocations: AllocationItem[];
}

export interface AllocationSuggestionDto {
  amount: string;
  category?: FinanceCategory;
}

export interface VoidDto {
  reason: string;
}

export const normalizeAmount = (value: string) => value.trim().replace(',', '.');

export const toKopecks = (value: string) => {
  const parsed = Number(normalizeAmount(value || '0'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export const formatMoney = (value: string | number) =>
  `${Number(value).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн`;

export const toAllocationItems = (items: { chargeId: string; amount: string }[]): AllocationItem[] =>
  items.flatMap((item) =>
    toKopecks(item.amount) > 0 ? [{ chargeId: item.chargeId, amount: normalizeAmount(item.amount) }] : [],
  );

export const financeApi = {
  getBalances: (params?: BalancesFilters) =>
    axiosInstance.get<FinanceBalance[]>('/finance/balances', { params }),

  getChildFinance: (childId: string) =>
    axiosInstance.get<ChildFinance>(`/children/${childId}/finance`),

  getHistory: (childId: string) =>
    axiosInstance.get<FinanceEvent[]>(`/children/${childId}/finance/history`),

  suggest: (childId: string, dto: AllocationSuggestionDto) =>
    axiosInstance.post<AllocationSuggestion>(`/children/${childId}/allocation-suggestion`, dto),

  createCharge: (childId: string, dto: CreateChargeDto) =>
    axiosInstance.post<ChildFinance>(`/children/${childId}/charges`, dto),

  createPayment: (childId: string, dto: CreatePaymentDto) =>
    axiosInstance.post<ChildFinance>(`/children/${childId}/payments`, dto),

  allocate: (paymentId: string, dto: AllocateDto) =>
    axiosInstance.post<ChildFinance>(`/payments/${paymentId}/allocations`, dto),

  voidCharge: (id: string, dto: VoidDto) =>
    axiosInstance.post<ChildFinance>(`/charges/${id}/void`, dto),

  voidPayment: (id: string, dto: VoidDto) =>
    axiosInstance.post<ChildFinance>(`/payments/${id}/void`, dto),

  voidAllocation: (id: string, dto: VoidDto) =>
    axiosInstance.post<ChildFinance>(`/allocations/${id}/void`, dto),
};
