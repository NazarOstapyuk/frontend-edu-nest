import { axiosInstance } from './axiosInstance';
import type { ChargeState, FinanceCategory } from './finance';
import type { BillingMode } from './tariffs';
import type { BillResult } from './billing';

export type AdjustmentType = 'custom_price' | 'discount_percent' | 'discount_amount' | 'pause';

export const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  custom_price: 'Своя ціна',
  discount_percent: 'Знижка, %',
  discount_amount: 'Знижка, грн',
  pause: 'Пауза',
};

export const adjustmentTypes = Object.keys(adjustmentTypeLabels) as AdjustmentType[];

export interface EnrollmentAdjustment {
  id: string;
  type: AdjustmentType;
  value: string | null;
  startDate: string;
  endDate: string | null;
  reason: string;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface BilledPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  amount: string;
  note: string | null;
  chargeId: string | null;
  chargeVoided: boolean;
  chargeState: ChargeState | null;
  needsRecalculation: boolean;
}

export interface NextPeriod {
  periodStart: string;
  periodEnd: string;
  amount: string | null;
  description: string | null;
  problem: 'no_price' | null;
}

export interface Enrollment {
  id: string;
  childId: string;
  tariff: { id: string; name: string; category: FinanceCategory; billingMode: BillingMode };
  startDate: string;
  endDate: string | null;
  billingMode: BillingMode | null;
  effectiveBillingMode: BillingMode;
  note: string | null;
  adjustments: EnrollmentAdjustment[];
  billedPeriods: BilledPeriod[];
  nextPeriod: NextPeriod | null;
}

export interface CreateEnrollmentDto {
  tariffId: string;
  startDate: string;
  endDate?: string;
  billingMode?: BillingMode;
  note?: string;
}

export interface EndEnrollmentDto {
  endDate: string;
}

export interface CreateAdjustmentDto {
  type: AdjustmentType;
  value?: string;
  startDate: string;
  endDate?: string;
  reason: string;
}

export const enrollmentsApi = {
  getByChild: (childId: string) => axiosInstance.get<Enrollment[]>(`/children/${childId}/enrollments`),

  create: (childId: string, dto: CreateEnrollmentDto) =>
    axiosInstance.post<Enrollment[]>(`/children/${childId}/enrollments`, dto),

  end: (id: string, dto: EndEnrollmentDto) => axiosInstance.patch<Enrollment[]>(`/enrollments/${id}/end`, dto),

  addAdjustment: (id: string, dto: CreateAdjustmentDto) =>
    axiosInstance.post<Enrollment[]>(`/enrollments/${id}/adjustments`, dto),

  voidAdjustment: (id: string, reason: string) =>
    axiosInstance.post<Enrollment[]>(`/adjustments/${id}/void`, { reason }),

  bill: (id: string) =>
    axiosInstance.post<{ result: BillResult; enrollments: Enrollment[] }>(`/enrollments/${id}/bill`),

  recalculate: (billedPeriodId: string, reason: string) =>
    axiosInstance.post<Enrollment[]>(`/billed-periods/${billedPeriodId}/recalculate`, { reason }),
};
