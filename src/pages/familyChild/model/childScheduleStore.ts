import { create } from 'zustand';
import { addDaysIso, localToday, parentCabinetApi, weekStart, type ParentSchedule } from '../../../shared/api';

interface ChildScheduleState {
  childId: string | null;
  week: string;
  key: string | null;
  data: ParentSchedule | null;
  loadFailed: boolean;
  load: (childId: string, week?: string) => Promise<void>;
}

export const useChildScheduleStore = create<ChildScheduleState>((set, get) => ({
  childId: null,
  week: weekStart(localToday()),
  key: null,
  data: null,
  loadFailed: false,
  load: async (childId, week = get().week) => {
    const key = `${childId}/${week}`;
    set({ childId, week, key, data: null, loadFailed: false });
    try {
      const { data } = await parentCabinetApi.getSchedule(childId, week, addDaysIso(week, 5));
      if (get().key === key) set({ data });
    } catch (error) {
      if (get().key === key) set({ loadFailed: true });
      throw error;
    }
  },
}));
