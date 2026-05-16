import { axiosInstance } from './axiosInstance';
import type { SubscriptionType } from './subscriptionTypes';

export type SubscriptionStatus = 'active' | 'cancelled' | 'finished';

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  active: 'Активний',
  cancelled: 'Скасований',
  finished: 'Завершений',
};

export interface SubscriptionInChild {
  id: string;
  childId: string;
  subscriptionTypeId: string;
  subscriptionType: SubscriptionType;
  totalSessions: number;
  remainingSessions: number;
  pricePerSession: number;
  totalPrice: number;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface Subscription extends SubscriptionInChild {
  child: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
  };
}

export interface CreateSubscriptionDto {
  childIds: string[];
  subscriptionTypeId: string;
  totalSessions: number;
}

export interface SubscriptionFilters {
  childId?: string;
  status?: SubscriptionStatus;
}

export const subscriptionsApi = {
  getList: (filters?: SubscriptionFilters) =>
    axiosInstance.get<Subscription[]>('/subscriptions', { params: filters }),

  getOne: (id: string) =>
    axiosInstance.get<Subscription>(`/subscriptions/${id}`),

  create: (dto: CreateSubscriptionDto) =>
    axiosInstance.post<Subscription[]>('/subscriptions', dto),

  update: (id: string, dto: { totalSessions: number }) =>
    axiosInstance.patch<Subscription>(`/subscriptions/${id}`, dto),

  cancel: (id: string) =>
    axiosInstance.patch<Subscription>(`/subscriptions/${id}/cancel`),

  getByChild: (childId: string) =>
    axiosInstance.get<Subscription[]>(`/children/${childId}/subscriptions`),

  delete: (id: string) =>
    axiosInstance.delete(`/subscriptions/${id}`),
};
