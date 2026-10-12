import { create } from 'zustand';
import { registerApi, type AdminNotice, type NoticeStatus } from '../../../shared/api';
import { usePendingNoticesStore } from '../../../shared/model/pendingNoticesStore';

interface AbsenceNoticesState {
  status: NoticeStatus;
  notices: AdminNotice[];
  isLoading: boolean;
  isSaving: boolean;
  loadFailed: boolean;
  setStatus: (status: NoticeStatus) => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string, reason: string) => Promise<void>;
  cancel: (id: string, reason: string) => Promise<void>;
}

export const useAbsenceNoticesStore = create<AbsenceNoticesState>((set, get) => {
  const decide = async (request: () => Promise<unknown>, id: string) => {
    set({ isSaving: true });
    try {
      await request();
      set((state) => ({ notices: state.notices.filter((n) => n.id !== id) }));
      usePendingNoticesStore.getState().refresh().catch(() => undefined);
    } finally {
      set({ isSaving: false });
    }
  };
  return {
    status: 'pending',
    notices: [],
    isLoading: false,
    isSaving: false,
    loadFailed: false,
    setStatus: async (status) => {
      set({ status, notices: [], isLoading: true, loadFailed: false });
      try {
        const { data } = await registerApi.getNotices(status);
        if (get().status === status) set({ notices: data });
      } catch (error) {
        if (get().status === status) set({ loadFailed: true });
        throw error;
      } finally {
        if (get().status === status) set({ isLoading: false });
      }
    },
    approve: (id) => decide(() => registerApi.approveNotice(id), id),
    reject: (id, reason) => decide(() => registerApi.rejectNotice(id, reason), id),
    cancel: (id, reason) => decide(() => registerApi.cancelNotice(id, reason), id),
  };
});
