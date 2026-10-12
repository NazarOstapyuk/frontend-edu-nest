import { create } from 'zustand';
import { parentCabinetApi, type CabinetFinance, type ChildCard } from '../../../shared/api';

interface FamilyChildState {
  childId: string | null;
  card: ChildCard | null;
  finance: CabinetFinance | null;
  isLoading: boolean;
  error: 'notFound' | 'failed' | null;
  fetchChild: (childId: string) => Promise<void>;
}

export const useFamilyChildStore = create<FamilyChildState>((set, get) => ({
  childId: null,
  card: null,
  finance: null,
  isLoading: false,
  error: null,
  fetchChild: async (childId) => {
    set({ childId, card: null, finance: null, isLoading: true, error: null });
    try {
      const [{ data: card }, { data: finance }] = await Promise.all([
        parentCabinetApi.getChild(childId),
        parentCabinetApi.getFinance(childId),
      ]);
      if (get().childId === childId) set({ card, finance });
    } catch (error) {
      if (get().childId === childId) {
        const status = (error as { statusCode?: number } | null)?.statusCode;
        set({ error: status === 404 || status === 403 ? 'notFound' : 'failed' });
      }
      throw error;
    } finally {
      if (get().childId === childId) set({ isLoading: false });
    }
  },
}));
