import { create } from 'zustand';
import { registerApi } from '../api';

interface PendingNoticesState {
  count: number;
  refresh: () => Promise<void>;
}

export const usePendingNoticesStore = create<PendingNoticesState>((set) => ({
  count: 0,
  refresh: async () => {
    const { data } = await registerApi.getNotices('pending');
    set({ count: data.length });
  },
}));
