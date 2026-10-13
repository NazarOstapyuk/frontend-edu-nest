import { create } from 'zustand';
import { addDaysIso, localToday, mealsApi, weekStart, type OrderDay, type ParentMenu } from '../../../shared/api';

interface ChildMealsState {
  week: string;
  key: string | null;
  data: ParentMenu | null;
  loadFailed: boolean;
  isSaving: boolean;
  load: (childId: string, week?: string) => Promise<void>;
  order: (childId: string, days: OrderDay[]) => Promise<void>;
  cancel: (childId: string, orderId: string) => Promise<void>;
}

export const useChildMealsStore = create<ChildMealsState>((set, get) => {
  const saving = async (childId: string, fn: () => Promise<unknown>) => {
    set({ isSaving: true });
    try {
      await fn();
      await get().load(childId);
    } finally {
      set({ isSaving: false });
    }
  };
  return {
    week: weekStart(localToday()),
    key: null,
    data: null,
    loadFailed: false,
    isSaving: false,
    load: async (childId, week = get().week) => {
      const key = `${childId}/${week}`;
      set({ week, key, data: get().key === key ? get().data : null, loadFailed: false });
      try {
        const { data } = await mealsApi.getParentMenu(childId, week, addDaysIso(week, 6));
        if (get().key === key) set({ data });
      } catch (error) {
        if (get().key === key) set({ loadFailed: true });
        throw error;
      }
    },
    order: (childId, days) => saving(childId, () => mealsApi.parentOrder(childId, days)),
    cancel: (childId, orderId) => saving(childId, () => mealsApi.parentCancel(childId, orderId)),
  };
});
