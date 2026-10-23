import { create } from 'zustand';
import { addDaysIso, kyivNow, routineApi, weekStart, type RoutineView } from '../../../shared/api';

interface ChildRoutineState {
  childId: string | null;
  week: string;
  key: string | null;
  data: RoutineView | null;
  loadFailed: boolean;
  load: (childId: string, week?: string) => Promise<void>;
}

export const useChildRoutineStore = create<ChildRoutineState>((set, get) => ({
  childId: null,
  week: weekStart(kyivNow().date),
  key: null,
  data: null,
  loadFailed: false,
  load: async (childId, week = get().week) => {
    const key = `${childId}/${week}`;
    set({ childId, week, key, data: null, loadFailed: false });
    try {
      const { data } = await routineApi.getChildRoutine(childId, week, addDaysIso(week, 6));
      if (get().key === key) set({ data });
    } catch (error) {
      if (get().key === key) set({ loadFailed: true });
      throw error;
    }
  },
}));
