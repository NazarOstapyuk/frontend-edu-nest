import type { User } from '../../entities/user';
import type { AccessScope, UpdateAccessDto } from './access';
import { axiosInstance } from './axiosInstance';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  role?: 'parent';
  positionId?: string;
  middleName?: string;
  phone?: string;
  email?: string;
  accessScope?: AccessScope;
  institutionIds?: string[];
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  login: string;
  password?: string;
  role?: 'parent';
  positionId?: string;
  middleName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UserLookup {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  isActive: boolean;
  institutionIds: string[];
}

export const usersApi = {
  lookup: (role: 'teacher' | 'parent', includeInactive = false) =>
    axiosInstance.get<UserLookup[]>('/users/lookup', { params: { role, includeInactive: includeInactive || undefined } }),

  getList: () =>
    axiosInstance.get<User[]>('/users'),

  create: (dto: CreateUserDto) =>
    axiosInstance.post<User>('/users', dto),

  update: (id: string, dto: UpdateUserDto) =>
    axiosInstance.patch<User>(`/users/${id}`, dto),

  setAccess: (id: string, dto: UpdateAccessDto) =>
    axiosInstance.patch<User>(`/users/${id}/access`, dto),

  delete: (id: string) =>
    axiosInstance.delete(`/users/${id}`),
};
