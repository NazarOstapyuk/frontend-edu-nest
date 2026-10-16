import { axiosInstance } from './axiosInstance';

export type DashboardPaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'online';

export interface TodayDashboard {
  date: string;
  register?: { count: number; names: string[]; more: number };
  notices?: { count: number };
  debts?: { children: number; amount: string };
  meals?: { count: number; groups: { name: string; count: number }[] };
  payments?: {
    total: string;
    count: number;
    byMethod: Record<DashboardPaymentMethod, string>;
  };
  onlinePending?: { count: number };
  payroll?: { month: string; count: number; names: string[]; more: number };
  backups?: { configured: boolean; stale: boolean };
}

export const dashboardApi = {
  today: () =>
    axiosInstance.get<TodayDashboard>('/dashboard/today').then((response) => response.data),
};
