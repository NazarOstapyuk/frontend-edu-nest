import { axiosInstance } from './axiosInstance';
import type {User} from "../../entities/user";

interface LoginCredentials {
  login: string;
  password: string;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    axiosInstance.post<User>('/auth/login', credentials),

  logout: () =>
    axiosInstance.post('/auth/logout'),

  me: () =>
    axiosInstance.get<User>('/auth/me'),

  refresh: () =>
    axiosInstance.post('/auth/refresh'),
};
