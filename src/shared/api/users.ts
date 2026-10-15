import type { User, UserRole } from '../../entities/user';
import type { UpdateAccessDto } from './access';
import { axiosInstance } from './axiosInstance';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  role: UserRole;
  middleName?: string;
  phone?: string;
  email?: string;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  login: string;
  password?: string;
  role: UserRole;
  middleName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export const usersApi = {
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
