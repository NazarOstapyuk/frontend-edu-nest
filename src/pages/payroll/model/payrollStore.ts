import { create } from 'zustand';
import {
  directionsApi,
  localToday,
  payrollApi,
  timetableApi,
  toKopecks,
  usersApi,
  type ClassFormat,
  type NamedItem,
  type PayrollDetail,
  type PayrollList,
  type PayrollRow,
  type SalaryTerms,
} from '../../../shared/api';

export interface TeacherOption {
  id: string;
  name: string;
}

export interface ClassGroupOption {
  id: string;
  name: string;
  format: ClassFormat;
}

const fromKopecks = (value: number) => (value / 100).toFixed(2);

const withRow = (list: PayrollList, detail: PayrollDetail): PayrollList => {
  const rows: PayrollRow[] = list.rows.map((row) =>
    row.teacher.id === detail.teacher.id
      ? {
          ...row,
          status: detail.status,
          accrued: detail.totals.accrued,
          paid: detail.totals.paid,
          balance: detail.totals.balance,
          lessons: detail.lessons,
          warnings: detail.warnings,
        }
      : row,
  );
  const total = (key: 'accrued' | 'paid' | 'balance') =>
    fromKopecks(rows.reduce((sum, row) => sum + toKopecks(row[key]), 0));
  return {
    ...list,
    rows,
    totals: { accrued: total('accrued'), paid: total('paid'), balance: total('balance') },
  };
};

interface PayrollState {
  teachers: TeacherOption[];
  subjects: NamedItem[];
  classGroups: ClassGroupOption[];
  refsFailed: boolean;
  loadRefs: () => Promise<void>;

  month: string;
  list: PayrollList | null;
  listFailed: boolean;
  setMonth: (month: string) => void;
  loadList: () => Promise<void>;

  detailTeacherId: string | null;
  detail: PayrollDetail | null;
  detailFailed: boolean;
  openDetail: (teacherId: string) => void;
  closeDetail: () => void;
  loadDetail: () => Promise<void>;
  isSaving: boolean;
  runDetail: (
    action: (teacherId: string, month: string) => Promise<{ data: PayrollDetail }>,
  ) => Promise<void>;

  termsTeacherId: string;
  terms: SalaryTerms[];
  termsLoading: boolean;
  termsFailed: boolean;
  setTermsTeacher: (teacherId: string) => void;
  loadTerms: () => Promise<void>;
  runTerms: (action: () => Promise<unknown>) => Promise<void>;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  teachers: [],
  subjects: [],
  classGroups: [],
  refsFailed: false,
  loadRefs: async () => {
    set({ refsFailed: false });
    try {
      const [users, subjects, directions] = await Promise.all([
        usersApi.getList(),
        timetableApi.getSubjects(),
        directionsApi.getList(),
      ]);
      set({
        teachers: users.data
          .filter((user) => user.role === 'teacher')
          .map((user) => ({ id: user.id, name: `${user.lastName} ${user.firstName}` }))
          .sort((a, b) => a.name.localeCompare(b.name, 'uk')),
        subjects: subjects.data,
        classGroups: directions.data.flatMap((direction) =>
          direction.groups.map((group) => ({
            id: group.id,
            name: `${direction.name}: ${group.name}`,
            format: group.format,
          })),
        ),
      });
    } catch (error) {
      set({ refsFailed: true });
      throw error;
    }
  },

  month: localToday().slice(0, 7),
  list: null,
  listFailed: false,
  setMonth: (month) => {
    set({ month, list: null, listFailed: false, detailTeacherId: null, detail: null });
    get().loadList().catch(() => undefined);
  },
  loadList: async () => {
    const month = get().month;
    set({ listFailed: false });
    try {
      const { data } = await payrollApi.getList(month);
      if (get().month === month) set({ list: data });
    } catch (error) {
      if (get().month === month) set({ listFailed: true });
      throw error;
    }
  },

  detailTeacherId: null,
  detail: null,
  detailFailed: false,
  isSaving: false,
  openDetail: (teacherId) => {
    set({ detailTeacherId: teacherId, detail: null, detailFailed: false });
    get().loadDetail().catch(() => undefined);
  },
  closeDetail: () => set({ detailTeacherId: null, detail: null, detailFailed: false }),
  loadDetail: async () => {
    const { detailTeacherId: teacherId, month } = get();
    if (!teacherId) return;
    const current = () => get().detailTeacherId === teacherId && get().month === month;
    set({ detailFailed: false });
    try {
      const { data } = await payrollApi.getDetail(teacherId, month);
      if (current()) set({ detail: data });
    } catch (error) {
      if (current()) set({ detailFailed: true });
      throw error;
    }
  },
  runDetail: async (action) => {
    const { detailTeacherId: teacherId, month } = get();
    if (!teacherId) return;
    set({ isSaving: true });
    try {
      const { data } = await action(teacherId, month);
      const { list } = get();
      if (get().detailTeacherId === teacherId && get().month === month) set({ detail: data });
      if (list && list.month === month) set({ list: withRow(list, data) });
    } finally {
      set({ isSaving: false });
    }
  },

  termsTeacherId: '',
  terms: [],
  termsLoading: false,
  termsFailed: false,
  setTermsTeacher: (teacherId) => {
    set({ termsTeacherId: teacherId, terms: [], termsFailed: false });
    if (teacherId) get().loadTerms().catch(() => undefined);
  },
  loadTerms: async () => {
    const teacherId = get().termsTeacherId;
    if (!teacherId) return;
    set({ termsLoading: true, termsFailed: false });
    try {
      const { data } = await payrollApi.getTerms(teacherId);
      if (get().termsTeacherId === teacherId) set({ terms: data });
    } catch (error) {
      if (get().termsTeacherId === teacherId) set({ termsFailed: true });
      throw error;
    } finally {
      if (get().termsTeacherId === teacherId) set({ termsLoading: false });
    }
  },
  runTerms: async (action) => {
    set({ isSaving: true });
    try {
      await action();
      await get().loadTerms();
    } finally {
      set({ isSaving: false });
    }
  },
}));
