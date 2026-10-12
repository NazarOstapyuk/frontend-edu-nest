import { create } from 'zustand';
import { parentCabinetApi, type CabinetFinance, type ChildCard } from '../../../shared/api';

interface FamilyChildState {
  childId: string | null;
  card: ChildCard | null;
  finance: CabinetFinance | null;
  isLoading: boolean;
  fetchChild: (childId: string) => Promise<void>;
}

export const useFamilyChildStore = create<FamilyChildState>((set, get) => ({
  childId: null,
  card: null,
  finance: null,
  isLoading: false,
  fetchChild: async (childId) => {
    set({ childId, card: null, finance: null, isLoading: true });
    try {
      const [{ data: card }, { data: finance }] = await Promise.all([
        parentCabinetApi.getChild(childId),
        parentCabinetApi.getFinance(childId),
      ]);
      if (get().childId === childId) set({ card, finance });
    } finally {
      if (get().childId === childId) set({ isLoading: false });
    }
  },
}));
