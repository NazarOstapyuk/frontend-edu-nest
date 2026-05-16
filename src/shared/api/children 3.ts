import type { User } from '../../entities/user';
import type { Group } from './groups';
import type { SubscriptionInChild } from './subscriptions';
import { axiosInstance } from './axiosInstance';

export type Gender = 'male' | 'female'

export const genderLabels: Record<Gender, string> = {
  male: 'Чоловіча',
  female: 'Жіноча',
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  group: Group | null;
  parents: User[];
  subscriptions: Subscription[];
  createdAt: string;
}

export interface CreateChildDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  groupId: string;
  parentIds: string[];
}

export interface UpdateChildDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  groupId: string;
  parentIds: string[];
}

export const childrenApi = {
  getList: () =>
    axiosInstance.get<Child[]>('/children'),

  create: (dto: CreateChildDto) =>
    axiosInstance.post<Child>('/children', dto),

  update: (id: string, dto: UpdateChildDto) =>
    axiosInstance.patch<Child>(`/children/${id}`, dto),

  delete: (id: string) =>
    axiosInstance.delete(`/children/${id}`),
};
