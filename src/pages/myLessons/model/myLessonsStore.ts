import { create } from 'zustand';
import { localToday, timetableApi, type MyLessons } from '../../../shared/api';

interface MyLessonsState {
  date: string;
  data: MyLessons | null;
  loadFailed: boolean;
  setDate: (date: string) => void;
  load: () => Promise<void>;
}

export const useMyLessonsStore = create<MyLessonsState>((set, get) => ({
  date: localToday(),
  data: null,
  loadFailed: false,
  setDate: (date) => set({ date }),
  load: async () => {
    const date = get().date;
    set({ data: null, loadFailed: false });
    try {
      const { data } = await timetableApi.getMyLessons(date);
      if (get().date === date) set({ data });
    } catch (error) {
      if (get().date === date) set({ loadFailed: true });
      throw error;
    }
  },
}));
