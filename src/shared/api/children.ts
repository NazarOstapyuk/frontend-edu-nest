import type { User } from '../../entities/user';
import type { Group } from './groups';
import { axiosInstance } from './axiosInstance';

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  group: Group | null;
  parents: User[];
  createdAt: string;
}

export interface CreateChildDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: string;
  parentIds: string[];
}

export interface UpdateChildDto {
  firstName: string;
  lastName: string;
  birthDate: string;
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
