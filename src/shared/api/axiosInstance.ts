import axios from 'axios';
import { useNotifyStore } from '../model/notifyStore';
import { translateError } from './errorMessages';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data ?? error;
    if (error.response?.status !== 401) {
      useNotifyStore.getState().push(translateError(data));
    }
    return Promise.reject(data);
  }
);
