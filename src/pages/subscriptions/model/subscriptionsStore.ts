import { create } from 'zustand';
import {
  subscriptionsApi,
  type Subscription,
  type SubscriptionFilters,
} from '../../../shared/api';

interface SubscriptionsState {
  subscriptions: Subscription[];
  filters: SubscriptionFilters;
  isLoading: boolean;
  isCancelling: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  editModal: { isOpen: boolean; subscription: Subscription | null };
  setEditModal: (value: Partial<{ isOpen: boolean; subscription: Subscription | null }>) => void;
  setFilters: (filters: SubscriptionFilters) => void;
  fetchSubscriptions: () => Promise<void>;
  updateSubscription: (id: string, totalSessions: number) => Promise<void>;
  updateSubscriptionInList: (updated: Subscription) => void;
  cancelSubscription: (id: string) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set, get) => ({
  subscriptions: [],
  filters: {},
  isLoading: false,
  isCancelling: false,
  isDeleting: false,
  isUpdating: false,
  editModal: { isOpen: false, subscription: null },

  setEditModal: (value) =>
    set((state) => ({ editModal: { ...state.editModal, ...value } })),

  setFilters: (filters) => set({ filters }),

  fetchSubscriptions: async () => {
    set({ isLoading: true });
    try {
      const { data } = await subscriptionsApi.getList(get().filters);
      set({ subscriptions: data });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSubscription: async (id, totalSessions) => {
    set({ isUpdating: true });
    try {
      const { data } = await subscriptionsApi.update(id, { totalSessions });
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? data : s)),
      }));
    } finally {
      set({ isUpdating: false });
    }
  },

  updateSubscriptionInList: (updated) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) => (s.id === updated.id ? updated : s)),
    })),

  cancelSubscription: async (id) => {
    set({ isCancelling: true });
    try {
      const { data } = await subscriptionsApi.cancel(id);
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? data : s)),
      }));
    } finally {
      set({ isCancelling: false });
    }
  },

  deleteSubscription: async (id) => {
    set({ isDeleting: true });
    try {
      await subscriptionsApi.delete(id);
      set((state) => ({
        subscriptions: state.subscriptions.filter((s) => s.id !== id),
      }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
