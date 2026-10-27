import { create } from 'zustand';
import { positionsApi, type Position, type PositionDto } from '../../../shared/api';
import { usePositionsStore } from '../../../entities/position';

interface PositionsPageState {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createModal: { isOpen: boolean };
  editModal: { isOpen: boolean; position: Position | null };
  deleteModal: { isOpen: boolean; position: Position | null };
  setCreateModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditModal: (value: Partial<{ isOpen: boolean; position: Position | null }>) => void;
  setDeleteModal: (value: Partial<{ isOpen: boolean; position: Position | null }>) => void;
  createPosition: (dto: PositionDto) => Promise<Position>;
  updatePosition: (id: string, dto: Partial<PositionDto>) => Promise<Position>;
  deletePosition: (id: string) => Promise<void>;
}

export const usePositionsPageStore = create<PositionsPageState>((set) => ({
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createModal: { isOpen: false },
  editModal: { isOpen: false, position: null },
  deleteModal: { isOpen: false, position: null },
  setCreateModal: (value) => set((state) => ({ createModal: { ...state.createModal, ...value } })),
  setEditModal: (value) => set((state) => ({ editModal: { ...state.editModal, ...value } })),
  setDeleteModal: (value) => set((state) => ({ deleteModal: { ...state.deleteModal, ...value } })),

  createPosition: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await positionsApi.create(dto);
      await usePositionsStore.getState().load();
      return data;
    } finally {
      set({ isCreating: false });
    }
  },

  updatePosition: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await positionsApi.update(id, dto);
      await usePositionsStore.getState().load();
      return data;
    } finally {
      set({ isUpdating: false });
    }
  },

  deletePosition: async (id) => {
    set({ isDeleting: true });
    try {
      await positionsApi.remove(id);
      await usePositionsStore.getState().load();
    } finally {
      set({ isDeleting: false });
    }
  },
}));
