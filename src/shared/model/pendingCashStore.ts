import { create } from 'zustand';
import { cashApi } from '../api';

interface PendingCashState {
  count: number;
  refresh: () => Promise<void>;
}

export const usePendingCashStore = create<PendingCashState>((set) => ({
  count: 0,
  refresh: async () => {
    const { count } = await cashApi.getAlertCount();
    set({ count });
  },
}));
