import { create } from 'zustand';
import { attendancesApi, subscriptionsApi, type Attendance, type CreateAttendanceDto, type Subscription } from '../../../shared/api';
import { useSubscriptionsStore } from './subscriptionsStore';

interface AttendancesState {
  attendances: Attendance[];
  subscription: Subscription | null;
  isOpen: boolean;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  open: (subscription: Subscription) => void;
  close: () => void;
  fetchAttendances: (subscriptionId: string) => Promise<void>;
  createAttendance: (subscriptionId: string, dto: CreateAttendanceDto) => Promise<void>;
  deleteAttendance: (subscriptionId: string, attendanceId: string) => Promise<void>;
}

const refreshSubscription = async (subscriptionId: string) => {
  const { data } = await subscriptionsApi.getOne(subscriptionId);
  useSubscriptionsStore.getState().updateSubscriptionInList(data);
  return data;
};

export const useAttendancesStore = create<AttendancesState>((set) => ({
  attendances: [],
  subscription: null,
  isOpen: false,
  isLoading: false,
  isCreating: false,
  isDeleting: false,

  open: (subscription) => {
    set({ isOpen: true, subscription, attendances: [] });
    useAttendancesStore.getState().fetchAttendances(subscription.id);
  },

  close: () => set({ isOpen: false, subscription: null, attendances: [] }),

  fetchAttendances: async (subscriptionId) => {
    set({ isLoading: true });
    try {
      const { data } = await attendancesApi.getList(subscriptionId);
      set({ attendances: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createAttendance: async (subscriptionId, dto) => {
    set({ isCreating: true });
    try {
      const { data } = await attendancesApi.create(subscriptionId, dto);
      set((state) => ({ attendances: [data, ...state.attendances] }));
      const updated = await refreshSubscription(subscriptionId);
      set({ subscription: updated });
    } finally {
      set({ isCreating: false });
    }
  },

  deleteAttendance: async (subscriptionId, attendanceId) => {
    set({ isDeleting: true });
    try {
      await attendancesApi.delete(subscriptionId, attendanceId);
      set((state) => ({ attendances: state.attendances.filter((a) => a.id !== attendanceId) }));
      const updated = await refreshSubscription(subscriptionId);
      set({ subscription: updated });
    } finally {
      set({ isDeleting: false });
    }
  },
}));
