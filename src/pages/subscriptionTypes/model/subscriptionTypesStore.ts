import { create } from 'zustand';
import {
  subscriptionTypesApi,
  type CreateSubscriptionTypeDto,
  type UpdateSubscriptionTypeDto,
  type SubscriptionType,
} from '../../../shared/api';

interface SubscriptionTypesState {
  subscriptionTypes: SubscriptionType[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createModal: { isOpen: boolean };
  editModal: { isOpen: boolean; subscriptionType: SubscriptionType | null };
  setCreateModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditModal: (value: Partial<{ isOpen: boolean; subscriptionType: SubscriptionType | null }>) => void;
  fetchSubscriptionTypes: () => Promise<void>;
  createSubscriptionType: (dto: CreateSubscriptionTypeDto) => Promise<void>;
  updateSubscriptionType: (id: string, dto: UpdateSubscriptionTypeDto) => Promise<void>;
  deleteSubscriptionType: (id: string) => Promise<void>;
}

export const useSubscriptionTypesStore = create<SubscriptionTypesState>((set) => ({
  subscriptionTypes: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createModal: { isOpen: false },
  editModal: { isOpen: false, subscriptionType: null },

  setCreateModal: (value) =>
    set((state) => ({ createModal: { ...state.createModal, ...value } })),

  setEditModal: (value) =>
    set((state) => ({ editModal: { ...state.editModal, ...value } })),

  fetchSubscriptionTypes: async () => {
    set({ isLoading: true });
    try {
      const { data } = await subscriptionTypesApi.getList();
      set({ subscriptionTypes: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createSubscriptionType: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await subscriptionTypesApi.create(dto);
      set((state) => ({ subscriptionTypes: [...state.subscriptionTypes, data] }));
    } finally {
      set({ isCreating: false });
    }
  },

  updateSubscriptionType: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await subscriptionTypesApi.update(id, dto);
      set((state) => ({
        subscriptionTypes: state.subscriptionTypes.map((s) => (s.id === id ? data : s)),
      }));
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteSubscriptionType: async (id) => {
    set({ isDeleting: true });
    try {
      await subscriptionTypesApi.delete(id);
      set((state) => ({
        subscriptionTypes: state.subscriptionTypes.filter((s) => s.id !== id),
      }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
