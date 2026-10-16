import { axiosInstance } from './axiosInstance';
import type { FinanceCategory } from './finance';

export type InvoiceStatus = 'pending' | 'success' | 'failure' | 'expired';
export type LinkState = 'open' | 'paid' | 'cancelled' | 'expired';
export type RequestSource = 'cabinet' | 'link';

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  pending: 'Обробляється',
  success: 'Успішно',
  failure: 'Відхилено',
  expired: 'Прострочено',
};

export const linkStateLabels: Record<LinkState, string> = {
  open: 'Очікує оплати',
  paid: 'Сплачено',
  cancelled: 'Скасовано',
  expired: 'Прострочено',
};

export const requestSourceLabels: Record<RequestSource, string> = {
  cabinet: 'Кабінет',
  link: 'Посилання',
};

export interface PayCategoryDto {
  category: FinanceCategory;
  amount: string;
}

export interface CreateLinkDto extends PayCategoryDto {
  comment?: string;
}

export interface PaymentRequestView {
  id: string;
  category: FinanceCategory;
  amount: string;
  source: RequestSource;
  status: LinkState;
  comment: string | null;
  expiresAt: string | null;
  createdAt: string;
  paidAt: string | null;
  createdBy: { id: string; firstName: string; lastName: string } | null;
  invoices: {
    id: string;
    invoiceId: string;
    status: InvoiceStatus;
    amount: string;
    failureReason: string | null;
    createdAt: string;
    paidAt: string | null;
  }[];
}

export interface PublicLink {
  institution: string;
  payer: string;
  category: FinanceCategory;
  amount: string;
  status: LinkState;
  expiresAt: string | null;
}

export const onlinePaymentsApi = {
  config: () => axiosInstance.get<{ enabled: boolean }>('/online-payments/config'),

  payCategory: (childId: string, dto: PayCategoryDto) =>
    axiosInstance.post<{ pageUrl: string }>(`/me/children/${childId}/online-payments`, dto),

  invoiceStatus: (invoiceId: string) =>
    axiosInstance.get<{ status: InvoiceStatus; amount: string; category: FinanceCategory; paidAt: string | null }>(
      `/me/online-payments/${invoiceId}`,
    ),

  createLink: (childId: string, dto: CreateLinkDto) =>
    axiosInstance.post<{ id: string; url: string; expiresAt: string }>(`/children/${childId}/payment-links`, dto),

  requests: (childId: string) =>
    axiosInstance.get<PaymentRequestView[]>(`/children/${childId}/payment-requests`),

  cancel: (id: string) => axiosInstance.post<PaymentRequestView>(`/payment-requests/${id}/cancel`),

  publicLink: (token: string) => axiosInstance.get<PublicLink>(`/pay/${token}`),

  payLink: (token: string) => axiosInstance.post<{ pageUrl: string }>(`/pay/${token}/invoice`),

  testResult: (invoiceId: string, result: 'success' | 'failure') =>
    axiosInstance.post<{ status: InvoiceStatus }>(`/online-payments/test/${invoiceId}`, { result }),
};

const PAY_AMOUNT_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export const payAmountError = (value: string): string | null => {
  const normalized = value.trim().replace(',', '.');
  if (!PAY_AMOUNT_PATTERN.test(normalized)) return 'Вкажіть суму, наприклад 1500.00';
  if (Number(normalized) < 1) return 'Мінімальна сума 1.00';
  return null;
};
