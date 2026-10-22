import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useNotifyStore } from '../model/notifyStore';
import { translateError } from './errorMessages';
import { getSelectedInstitutionId } from '../model/institutionStore';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const institutionId = getSelectedInstitutionId();
  if (institutionId) config.headers.set('X-Institution-Id', institutionId);
  return config;
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

const readBlobError = async (blob: Blob): Promise<unknown> => {
  try {
    return JSON.parse(await blob.text());
  } catch {
    return {};
  }
};

let refreshing: Promise<unknown> | null = null;

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (error.response?.data instanceof Blob) {
      error.response.data = await readBlobError(error.response.data);
    }
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
