import { create } from 'zustand';
import { parentCabinetApi, type Family } from '../../../shared/api';

interface FamilyState {
  family: Family | null;
  isLoading: boolean;
  hasError: boolean;
  fetchFamily: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  family: null,
  isLoading: false,
  hasError: false,
  fetchFamily: async () => {
    set({ isLoading: true, hasError: false });
    try {
      const { data } = await parentCabinetApi.getFamily();
      set({ family: data });
    } catch (error) {
      set({ hasError: true });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
