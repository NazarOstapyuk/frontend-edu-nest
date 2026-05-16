import { axiosInstance } from './axiosInstance';

export interface SubscriptionType {
  id: string;
  name: string;
  pricePerSession: number;
  createdAt: string;
}

export interface CreateSubscriptionTypeDto {
  name: string;
  pricePerSession: number;
}

export interface UpdateSubscriptionTypeDto {
  name: string;
  pricePerSession: number;
}

export const subscriptionTypesApi = {
  getList: () =>
    axiosInstance.get<SubscriptionType[]>('/subscription-types'),

  create: (dto: CreateSubscriptionTypeDto) =>
    axiosInstance.post<SubscriptionType>('/subscription-types', dto),

  update: (id: string, dto: UpdateSubscriptionTypeDto) =>
    axiosInstance.patch<SubscriptionType>(`/subscription-types/${id}`, dto),

  delete: (id: string) =>
    axiosInstance.delete(`/subscription-types/${id}`),
};
