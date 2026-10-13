import { axiosInstance } from './axiosInstance';
import type { PersonRef } from './finance';

export type PayrollCalendar = 'all' | 'kindergarten' | 'school_class';
export type PayrollLessonType = 'school_lesson' | 'class_group' | 'individual';
export type PayrollStatus = 'draft' | 'approved';
export type PayrollLineType = 'base' | 'allowance' | 'lesson' | 'correction' | 'adjustment';
export type PayrollAdjustmentKind = 'bonus' | 'deduction';
export type PayrollPaymentMethod = 'cash' | 'card';

export const payrollCalendarLabels: Record<PayrollCalendar, string> = {
  all: 'Загальний',
  kindergarten: 'Садочок',
  school_class: 'Школа',
};

export const payrollLessonTypeLabels: Record<PayrollLessonType, string> = {
  school_lesson: 'Шкільні уроки',
  class_group: 'Групові гуртки',
  individual: 'Індивідуальні заняття',
};

export const payrollStatusLabels: Record<PayrollStatus, string> = {
  draft: 'Чернетка',
  approved: 'Затверджено',
};

export const payrollAdjustmentKindLabels: Record<PayrollAdjustmentKind, string> = {
  bonus: 'Доплата',
  deduction: 'Утримання',
};

export const payrollPaymentMethodLabels: Record<PayrollPaymentMethod, string> = {
  cash: 'Готівка',
  card: 'Картка / рахунок',
};

export interface SalaryRate {
  id: string;
  lessonType: PayrollLessonType;
  subjectId: string | null;
  subjectName: string | null;
  classGroupId: string | null;
  classGroupName: string | null;
  amount: string;
}

export interface SalaryAllowance {
  id: string;
  name: string;
  amount: string;
}

export interface SalaryTerms {
  id: string;
  teacherId: string;
  validFrom: string;
  validTo: string | null;
  monthlyRate: string;
  calendarKind: PayrollCalendar;
  note: string | null;
  started: boolean;
  createdAt: string;
  rates: SalaryRate[];
  allowances: SalaryAllowance[];
}

export interface SalaryRateDto {
  lessonType: PayrollLessonType;
  subjectId?: string;
  classGroupId?: string;
  amount: string;
}

export interface SalaryAllowanceDto {
  name: string;
  amount: string;
}

export interface UpdateSalaryTermsDto {
  monthlyRate?: string;
  calendarKind?: PayrollCalendar;
  note?: string;
  rates?: SalaryRateDto[];
  allowances?: SalaryAllowanceDto[];
}

export interface CreateSalaryTermsDto {
  teacherId: string;
  validFrom: string;
  monthlyRate: string;
  calendarKind: PayrollCalendar;
  note?: string;
  rates: SalaryRateDto[];
  allowances: SalaryAllowanceDto[];
}

export interface PayrollDays {
  normDays: number;
  defaultDays: number;
  workedDays: number;
  override: boolean;
}

export interface PayrollLine {
  type: PayrollLineType;
  title: string;
  date: string | null;
  lessonType: PayrollLessonType | null;
  refMonth: string | null;
  amount: string;
  noRate: boolean;
  sourceType: 'school_lesson' | 'class_lesson' | null;
  sourceId: string | null;
}

export interface PayrollAdjustment {
  id: string;
  kind: PayrollAdjustmentKind;
  amount: string;
  reason: string;
  createdAt: string;
  createdBy?: PersonRef;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface PayrollPayment {
  id: string;
  date: string;
  amount: string;
  method: PayrollPaymentMethod;
  comment: string | null;
  createdAt: string;
  createdBy?: PersonRef;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface PayrollWarnings {
  noRate: number;
  lessonsWithoutTerms: number;
}

export interface PayrollTotals {
  accrued: string;
  paid: string;
  balance: string;
}

export interface PayrollDetail {
  teacher: PersonRef;
  month: string;
  status: PayrollStatus;
  approvedAt: string | null;
  reopenReason: string | null;
  days: PayrollDays;
  lines: PayrollLine[];
  adjustments: PayrollAdjustment[];
  payments: PayrollPayment[];
  warnings: PayrollWarnings;
  lessons: number;
  totals: PayrollTotals;
}

export interface PayrollRow {
  teacher: PersonRef;
  status: PayrollStatus;
  accrued: string;
  paid: string;
  balance: string;
  lessons: number;
  warnings: PayrollWarnings;
}

export interface PayrollList {
  month: string;
  rows: PayrollRow[];
  totals: PayrollTotals;
}

export interface MyPayrollMonth {
  month: string;
  status: PayrollStatus;
  accrued: string;
  paid: string;
  balance: string;
}

export interface MyPayrollYear {
  year: number;
  months: MyPayrollMonth[];
}

export interface PayrollAdjustmentDto {
  kind: PayrollAdjustmentKind;
  amount: string;
  reason: string;
}

export interface PayrollPaymentDto {
  date: string;
  amount: string;
  method: PayrollPaymentMethod;
  comment?: string;
}

const sheetPath = (teacherId: string, month: string) => `/payroll/${teacherId}/${month}`;

export const payrollApi = {
  getTerms: (teacherId: string) =>
    axiosInstance.get<SalaryTerms[]>('/salary-terms', { params: { teacherId } }),
  createTerms: (dto: CreateSalaryTermsDto) => axiosInstance.post<SalaryTerms>('/salary-terms', dto),
  updateTerms: (id: string, dto: UpdateSalaryTermsDto) =>
    axiosInstance.patch<SalaryTerms>(`/salary-terms/${id}`, dto),
  deleteTerms: (id: string) => axiosInstance.delete<{ message: string }>(`/salary-terms/${id}`),
  closeTerms: (id: string, validTo: string) =>
    axiosInstance.patch<SalaryTerms>(`/salary-terms/${id}/close`, { validTo }),
  getList: (month: string) => axiosInstance.get<PayrollList>('/payroll', { params: { month } }),
  getDetail: (teacherId: string, month: string) =>
    axiosInstance.get<PayrollDetail>(sheetPath(teacherId, month)),
  setWorkedDays: (teacherId: string, month: string, workedDays: number | null) =>
    axiosInstance.patch<PayrollDetail>(`${sheetPath(teacherId, month)}/worked-days`, { workedDays }),
  addAdjustment: (teacherId: string, month: string, dto: PayrollAdjustmentDto) =>
    axiosInstance.post<PayrollDetail>(`${sheetPath(teacherId, month)}/adjustments`, dto),
  voidAdjustment: (id: string, reason: string) =>
    axiosInstance.post<PayrollDetail>(`/payroll-adjustments/${id}/void`, { reason }),
  addPayment: (teacherId: string, month: string, dto: PayrollPaymentDto) =>
    axiosInstance.post<PayrollDetail>(`${sheetPath(teacherId, month)}/payments`, dto),
  voidPayment: (id: string, reason: string) =>
    axiosInstance.post<PayrollDetail>(`/payroll-payments/${id}/void`, { reason }),
  approve: (teacherId: string, month: string) =>
    axiosInstance.post<PayrollDetail>(`${sheetPath(teacherId, month)}/approve`),
  reopen: (teacherId: string, month: string, reason: string) =>
    axiosInstance.post<PayrollDetail>(`${sheetPath(teacherId, month)}/reopen`, { reason }),
  getMyYear: (year: number) =>
    axiosInstance.get<MyPayrollYear>('/me/payroll', { params: { year: String(year) } }),
  getMyMonth: (month: string) => axiosInstance.get<PayrollDetail>(`/me/payroll/${month}`),
};
