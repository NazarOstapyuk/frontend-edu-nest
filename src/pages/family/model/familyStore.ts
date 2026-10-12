import { create } from 'zustand';
import { parentCabinetApi, type Family } from '../../../shared/api';

interface FamilyState {
  family: Family | null;
  isLoading: boolean;
  fetchFamily: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  isLoading: false,
  fetchFamily: async () => {
    set({ isLoading: true });
    try {
      const { data } = await parentCabinetApi.getFamily();
      set({ family: data });
    } finally {
      set({ isLoading: false });
    }
  },
}));
