import { create } from 'zustand';
import { authApi, setSessionHandlers, type ContactsDto } from '../../../shared/api';
import { useNotifyStore } from '../../../shared/model/notifyStore';
import { useInstitutionStore } from '../../../shared/model/institutionStore';
import type { SessionProfile } from './types';

interface LoginCredentials {
  login: string;
  password: string;
}

interface AuthState {
  profile: SessionProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<SessionProfile>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<SessionProfile>;
  updateContacts: (dto: ContactsDto) => Promise<void>;
  markPasswordChangeRequired: () => void;
  expireSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  isLoading: false,
  isInitialized: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      await authApi.login(credentials);
      const { data } = await authApi.me();
      set({ profile: data, isInitialized: true });
      useInstitutionStore.getState().reconcile(data);
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      try {
        await authApi.logout();
      } catch (error) {
        if ((error as { statusCode?: number })?.statusCode !== 401) throw error;
        await authApi.refresh();
        await authApi.logout().catch(() => undefined);
      }
    } finally {
      set({ profile: null });
    }
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.me();
      set({ profile: data });
      useInstitutionStore.getState().reconcile(data);
    } catch {
      set({ profile: null });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    await authApi.changePassword(currentPassword, newPassword);
    const { data } = await authApi.me();
    set({ profile: data });
    return data;
  },

  updateContacts: async (dto) => {
    const { data } = await authApi.updateContacts(dto);
    set({ profile: data });
  },

  markPasswordChangeRequired: () => {
    const profile = get().profile;
    if (profile && !profile.mustChangePassword) set({ profile: { ...profile, mustChangePassword: true } });
  },

  expireSession: () => {
    if (get().profile) useNotifyStore.getState().push('Сесія завершилась, увійдіть знову');
    set({ profile: null, isInitialized: true });
  },
}));

setSessionHandlers({
  onExpired: () => useAuthStore.getState().expireSession(),
  onPasswordChangeRequired: () => useAuthStore.getState().markPasswordChangeRequired(),
});
