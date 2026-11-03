import { create } from 'zustand';
import { staffTasksApi } from '../api';

interface PendingTasksState {
  open: number;
  overdue: number;
  refresh: () => Promise<void>;
}

export const usePendingTasksStore = create<PendingTasksState>((set) => ({
  open: 0,
  overdue: 0,
  refresh: async () => {
    const { data } = await staffTasksApi.getSummary();
    set({ open: data.open, overdue: data.overdue });
  },
}));
