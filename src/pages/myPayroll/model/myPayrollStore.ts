import { create } from 'zustand';
import { localToday, payrollApi, type MyPayrollYear, type PayrollDetail } from '../../../shared/api';

interface MyPayrollState {
  year: number;
  data: MyPayrollYear | null;
  failed: boolean;
  setYear: (year: number) => void;
  load: () => Promise<void>;
  month: string | null;
  detail: PayrollDetail | null;
  detailFailed: boolean;
  openMonth: (month: string) => void;
  closeMonth: () => void;
  loadMonth: () => Promise<void>;
}

export const useMyPayrollStore = create<MyPayrollState>((set, get) => ({
  year: Number(localToday().slice(0, 4)),
  data: null,
  failed: false,
  setYear: (year) => {
    set({ year, data: null, failed: false });
    get().load().catch(() => undefined);
  },
  load: async () => {
    const year = get().year;
    set({ failed: false });
    try {
      const { data } = await payrollApi.getMyYear(year);
      if (get().year === year) set({ data });
    } catch (error) {
      if (get().year === year) set({ failed: true });
      throw error;
    }
  },
  month: null,
  detail: null,
  detailFailed: false,
  openMonth: (month) => {
    set({ month, detail: null, detailFailed: false });
    get().loadMonth().catch(() => undefined);
  },
  closeMonth: () => set({ month: null, detail: null, detailFailed: false }),
  loadMonth: async () => {
    const month = get().month;
    if (!month) return;
    set({ detailFailed: false });
    try {
      const { data } = await payrollApi.getMyMonth(month);
      if (get().month === month) set({ detail: data });
    } catch (error) {
      if (get().month === month) set({ detailFailed: true });
      throw error;
    }
  },
}));
