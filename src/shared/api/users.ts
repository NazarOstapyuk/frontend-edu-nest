import type { User, UserRole } from '../../entities/user';
import { axiosInstance } from './axiosInstance';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  role: UserRole;
}

export const usersApi = {
  getList: () =>
    axiosInstance.get<User[]>('/users'),

  create: (dto: CreateUserDto) =>
    axiosInstance.post<User>('/users', dto),

  delete: (id: string) =>
    axiosInstance.delete(`/users/${id}`),
};
