import { create } from 'zustand';
import {
  adaptationApi,
  tariffsApi,
  type AdaptationVisit,
  type CreateAdaptationVisitDto,
  type Tariff,
} from '../../../shared/api';
import { useChildFinanceStore } from './childFinanceStore';
import { fetchChildInstitutionId } from './childInstitution';

interface AdaptationState {
  childId: string | null;
  visits: AdaptationVisit[];
  tariffOptions: Tariff[];
  childInstitutionId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  createVisitModal: { isOpen: boolean };
  voidTarget: AdaptationVisit | null;
  setCreateVisitModal: (value: Partial<{ isOpen: boolean }>) => void;
  setVoidTarget: (visit: AdaptationVisit | null) => void;
  fetchVisits: (childId: string) => Promise<void>;
  createVisit: (dto: CreateAdaptationVisitDto) => Promise<void>;
  voidVisit: (reason: string) => Promise<void>;
}

export const useAdaptationStore = create<AdaptationState>((set, get) => {
  const mutate = async (request: () => Promise<AdaptationVisit[]>) => {
    const childId = get().childId;
    set({ isSaving: true });
    try {
      const visits = await request();
      if (get().childId === childId) {
        set({ visits });
        if (childId) await useChildFinanceStore.getState().fetchFinance(childId).catch(() => undefined);
      }
    } finally {
      set({ isSaving: false });
    }
  };

  return {
    childId: null,
    visits: [],
    tariffOptions: [],
    childInstitutionId: null,
    isLoading: false,
    isSaving: false,
    createVisitModal: { isOpen: false },
    voidTarget: null,

    setCreateVisitModal: (value) =>
      set((state) => ({ createVisitModal: { ...state.createVisitModal, ...value } })),

    setVoidTarget: (visit) => set({ voidTarget: visit }),

    fetchVisits: async (childId) => {
      set({ isLoading: true, childId, visits: [] });
      try {
        const [{ data: visits }, { data: tariffs }, institutionId] = await Promise.all([
          adaptationApi.getByChild(childId),
          tariffsApi.getList(),
          fetchChildInstitutionId(childId),
        ]);
        if (get().childId === childId) set({ visits, tariffOptions: tariffs, childInstitutionId: institutionId });
      } finally {
        set({ isLoading: false });
      }
    },

    createVisit: (dto) =>
      mutate(async () => {
        const { childId } = get();
        if (!childId) throw new Error('Child is not selected');
        return (await adaptationApi.create(childId, dto)).data;
      }),

    voidVisit: async (reason) => {
      const target = get().voidTarget;
      if (!target) return;
      await mutate(async () => (await adaptationApi.void(target.id, reason)).data);
    },
  };
});
