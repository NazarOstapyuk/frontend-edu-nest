import { axiosInstance } from './axiosInstance';

export interface BillingProblem {
  enrollmentId: string;
  childId: string;
  childName: string;
  tariffName: string;
  periodStart: string;
  reason: 'no_price';
}

export interface BillResult {
  created: number;
  skippedZero: number;
  alreadyBilled: number;
  problems: BillingProblem[];
  failed: { enrollmentId: string; message: string }[];
}

export interface BillingSettings {
  chargeLeadDays: number;
}

export const billingApi = {
  run: () => axiosInstance.post<BillResult>('/billing/run'),

  getProblems: () => axiosInstance.get<BillingProblem[]>('/billing/problems'),

  getSettings: () => axiosInstance.get<BillingSettings>('/settings/billing'),

  updateSettings: (dto: BillingSettings) => axiosInstance.patch<BillingSettings>('/settings/billing', dto),
};
