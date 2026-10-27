import { create } from 'zustand';
import { positionsApi, type Position } from '../../../shared/api';

interface PositionsState {
  positions: Position[];
  isLoading: boolean;
  load: () => Promise<void>;
}

export const usePositionsStore = create<PositionsState>((set) => ({
  positions: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const { data } = await positionsApi.list();
      set({ positions: data });
    } finally {
      set({ isLoading: false });
    }
  },
}));
