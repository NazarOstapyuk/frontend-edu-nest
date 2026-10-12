import { axiosInstance } from './axiosInstance';
import type { SessionProfile } from '../../entities/user';

interface LoginCredentials {
  login: string;
  password: string;
}

export interface ContactsDto {
  phone?: string;
  email?: string | null;
}

export const authApi = {
  login: (credentials: LoginCredentials) => axiosInstance.post<{ message: string }>('/auth/login', credentials),
  logout: () => axiosInstance.post('/auth/logout'),
  me: () => axiosInstance.get<SessionProfile>('/auth/me'),
  refresh: () => axiosInstance.post('/auth/refresh'),
  changePassword: (currentPassword: string, newPassword: string) =>
    axiosInstance.post<{ message: string }>('/me/password', { currentPassword, newPassword }),
  updateContacts: (dto: ContactsDto) => axiosInstance.patch<SessionProfile>('/me/contacts', dto),
};
