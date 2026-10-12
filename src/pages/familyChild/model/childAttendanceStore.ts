import { create } from 'zustand';
import {
  localToday,
  parentCabinetApi,
  registerApi,
  type AbsenceReason,
  type ChildRegisterMonth,
  type CreateNoticeDto,
  type ParentNotice,
} from '../../../shared/api';

interface ChildAttendanceState {
  childId: string | null;
  month: string;
  register: ChildRegisterMonth | null;
  registerKey: string | null;
  notices: ParentNotice[];
  reasons: AbsenceReason[];
  isSaving: boolean;
  loadFailed: boolean;
  open: (childId: string) => Promise<void>;
  setMonth: (month: string) => Promise<void>;
  createNotice: (dto: CreateNoticeDto) => Promise<void>;
  cancelNotice: (noticeId: string) => Promise<void>;
}

export const useChildAttendanceStore = create<ChildAttendanceState>((set, get) => ({
  childId: null,
  month: localToday().slice(0, 7),
  register: null,
  registerKey: null,
  notices: [],
  reasons: [],
  isSaving: false,
  loadFailed: false,
  open: async (childId) => {
    set({ childId, notices: [], register: null, registerKey: null, loadFailed: false });
    try {
      const [, { data: notices }, { data: reasons }] = await Promise.all([
        get().setMonth(get().month),
        parentCabinetApi.getNotices(childId),
        registerApi.getReasons(),
      ]);
      if (get().childId === childId) set({ notices, reasons });
    } catch (error) {
      if (get().childId === childId) set({ loadFailed: true });
      throw error;
    }
  },
  setMonth: async (month) => {
    const { childId } = get();
    if (!childId) return;
    const key = `${childId}/${month}`;
    set({ month, registerKey: key, register: null, loadFailed: false });
    try {
      const { data } = await parentCabinetApi.getRegister(childId, month);
      if (get().registerKey === key) set({ register: data });
    } catch (error) {
      if (get().registerKey === key) set({ loadFailed: true });
      throw error;
    }
  },
  createNotice: async (dto) => {
    const { childId } = get();
    if (!childId) return;
    set({ isSaving: true });
    try {
      const { data } = await parentCabinetApi.createNotice(childId, dto);
      if (get().childId === childId) set((state) => ({ notices: [data, ...state.notices] }));
    } finally {
      set({ isSaving: false });
    }
  },
  cancelNotice: async (noticeId) => {
    const { childId } = get();
    if (!childId) return;
    set({ isSaving: true });
    try {
      const { data } = await parentCabinetApi.cancelNotice(childId, noticeId);
      if (get().childId === childId) {
        set((state) => ({ notices: state.notices.map((n) => (n.id === noticeId ? data : n)) }));
      }
    } finally {
      set({ isSaving: false });
    }
  },
}));
