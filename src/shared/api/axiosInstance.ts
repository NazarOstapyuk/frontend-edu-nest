import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useNotifyStore } from '../model/notifyStore';
import { translateError } from './errorMessages';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout'];

type SessionHandlers = { onExpired: () => void; onPasswordChangeRequired: () => void };

let handlers: SessionHandlers = {
  onExpired: () => undefined,
  onPasswordChangeRequired: () => undefined,
};

export const setSessionHandlers = (next: SessionHandlers) => {
  handlers = next;
};

let refreshing: Promise<unknown> | null = null;

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const data = (error.response?.data ?? error) as { message?: unknown };
    const original = error.config as RetryConfig | undefined;

    if (status === 401 && original && !original._retried && !NO_REFRESH.some((p) => original.url?.startsWith(p))) {
      original._retried = true;
      refreshing ??= axiosInstance.post('/auth/refresh').finally(() => {
        refreshing = null;
      });
      try {
        await refreshing;
      } catch {
        handlers.onExpired();
        return Promise.reject(data);
      }
      return axiosInstance(original);
    }

    if (status === 403 && data.message === 'Password change required') {
      handlers.onPasswordChangeRequired();
      return Promise.reject(data);
    }

    if (status !== 401) {
      useNotifyStore.getState().push(translateError(data));
    }
    return Promise.reject(data);
  }
);
