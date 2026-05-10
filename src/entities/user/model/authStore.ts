import { create } from 'zustand';
import { authApi } from '../../../shared/api';
import type { User } from './types';

interface LoginCredentials {
  login: string;
  password: string;
}

interface AuthState {
  profile: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: false,
  isInitialized: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login(credentials);
      set({ profile: data });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ profile: null });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.me();
      set({ profile: data });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  refresh: async () => {
    await authApi.refresh();
  },
}));
