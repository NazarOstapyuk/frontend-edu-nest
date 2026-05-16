import { create } from 'zustand';
import { childrenApi, type CreateChildDto, type UpdateChildDto, type Child } from '../../../shared/api';

interface ChildrenState {
  children: Child[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createChildModal: { isOpen: boolean };
  editChildModal: { isOpen: boolean; child: Child | null };
  setCreateChildModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditChildModal: (value: Partial<{ isOpen: boolean; child: Child | null }>) => void;
  fetchChildren: () => Promise<void>;
  createChild: (dto: CreateChildDto) => Promise<void>;
  updateChild: (id: string, dto: UpdateChildDto) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
}

export const useChildrenStore = create<ChildrenState>((set) => ({
  children: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createChildModal: { isOpen: false },
  editChildModal: { isOpen: false, child: null },

  setCreateChildModal: (value) =>
    set((state) => ({ createChildModal: { ...state.createChildModal, ...value } })),

  setEditChildModal: (value) =>
    set((state) => ({ editChildModal: { ...state.editChildModal, ...value } })),

  fetchChildren: async () => {
    set({ isLoading: true });
    try {
      const { data } = await childrenApi.getList();
      set({ children: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createChild: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await childrenApi.create(dto);
      set((state) => ({ children: [...state.children, data] }));
    } finally {
      set({ isCreating: false });
    }
  },

  updateChild: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await childrenApi.update(id, dto);
      set((state) => ({
        children: state.children.map((c) => (c.id === id ? data : c)),
      }));
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteChild: async (id) => {
    set({ isDeleting: true });
    try {
      await childrenApi.delete(id);
      set((state) => ({ children: state.children.filter((c) => c.id !== id) }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
