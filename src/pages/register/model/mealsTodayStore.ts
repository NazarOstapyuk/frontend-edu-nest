import { create } from 'zustand';
import { mealsApi, type TodayOrders } from '../../../shared/api';

interface MealsTodayState {
  key: string | null;
  data: TodayOrders | null;
  failed: boolean;
  load: (groupId: string) => Promise<void>;
}

export const useMealsTodayStore = create<MealsTodayState>((set, get) => ({
  key: null,
  data: null,
  failed: false,
  load: async (groupId) => {
    set({ key: groupId, data: null, failed: false });
    try {
      const { data } = await mealsApi.getToday(groupId);
      if (get().key === groupId) set({ data });
    } catch (error) {
      if (get().key === groupId) set({ failed: true });
      throw error;
    }
  },
}));
