import { axiosInstance } from './axiosInstance';
import type { FinanceCategory, PaymentMethod, ChargeState } from './finance';
import type { AttendanceStatus, PackageState } from './classes';
import type { ChildRegisterMonth, CreateNoticeDto, ParentNotice } from './register';

export interface FamilyChild {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  group: { id: string; name: string } | null;
  due: string;
  overdue: string;
  prepayment: string;
}

export interface Family {
  children: FamilyChild[];
  totals: { due: string; overdue: string; prepayment: string };
}

export interface ParentContact {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  email: string | null;
}

export type Visit =
  | { type: 'lesson'; date: string; groupName: string; directionName: string; status: AttendanceStatus; isGuest: boolean }
  | { type: 'adaptation'; date: string; hours: string }
  | { type: 'legacy'; date: string; note: string | null; directionName: string };

export interface ChildCard {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string;
  group: { id: string; name: string } | null;
  parents: ParentContact[];
  enrollments: { id: string; tariffName: string; startDate: string; endDate: string | null; pauses: { startDate: string; endDate: string | null }[] }[];
  packages: { id: string; directionName: string; sessionsTotal: number; used: number; remaining: number; expiresAt: string | null; state: PackageState }[];
  visits: Visit[];
}

export interface CabinetCharge {
  id: string;
  category: FinanceCategory;
  description: string;
  periodStart: string | null;
  periodEnd: string | null;
  amount: string;
  paid: string;
  remaining: string;
  state: ChargeState;
  overdue: boolean;
  createdAt: string;
}

export interface CabinetPayment {
  id: string;
  receivedAt: string;
  amount: string;
  method: PaymentMethod;
  category: FinanceCategory | null;
  allocated: string;
  free: string;
  allocations: { chargeId: string; description: string; amount: string }[];
}

export interface CabinetFinance {
  summary: { category: FinanceCategory; due: string; overdue: string; prepayment: string }[];
  unallocated: string;
  charges: CabinetCharge[];
  payments: CabinetPayment[];
}

export const parentCabinetApi = {
  getFamily: () => axiosInstance.get<Family>('/me/family'),
  getChild: (id: string) => axiosInstance.get<ChildCard>(`/me/children/${id}`),
  getFinance: (id: string) => axiosInstance.get<CabinetFinance>(`/me/children/${id}/finance`),
  getRegister: (id: string, month: string) =>
    axiosInstance.get<ChildRegisterMonth>(`/me/children/${id}/register`, { params: { month } }),
  getNotices: (id: string) => axiosInstance.get<ParentNotice[]>(`/me/children/${id}/absence-notices`),
  createNotice: (id: string, dto: CreateNoticeDto) =>
    axiosInstance.post<ParentNotice>(`/me/children/${id}/absence-notices`, dto),
  cancelNotice: (id: string, noticeId: string) =>
    axiosInstance.post<ParentNotice>(`/me/children/${id}/absence-notices/${noticeId}/cancel`),
};
