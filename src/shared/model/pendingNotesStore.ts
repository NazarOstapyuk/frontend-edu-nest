import { create } from 'zustand';
import { dailyNotesApi } from '../api';

interface PendingNotesState {
  count: number;
  refresh: () => Promise<void>;
}

export const usePendingNotesStore = create<PendingNotesState>((set) => ({
  count: 0,
  refresh: async () => {
    const { data } = await dailyNotesApi.getPending();
    set({ count: data.filter((row) => row.own).reduce((sum, row) => sum + row.pending, 0) });
  },
}));
