import { create } from 'zustand';
import {
  financeApi,
  type AllocateDto,
  type AllocationSuggestion,
  type AllocationSuggestionDto,
  type ChildFinance,
  type CreateChargeDto,
  type CreatePaymentDto,
  type FinanceEvent,
  type FinancePayment,
} from '../../../shared/api';

export type VoidTarget = { kind: 'charge' | 'payment' | 'allocation'; id: string; title: string };

interface ChildFinanceState {
  finance: ChildFinance | null;
  history: FinanceEvent[];
  isLoading: boolean;
  isSaving: boolean;
  createChargeModal: { isOpen: boolean };
  createPaymentModal: { isOpen: boolean };
  allocateModal: { isOpen: boolean; payment: FinancePayment | null };
  voidModal: { isOpen: boolean; target: VoidTarget | null };
  setCreateChargeModal: (value: Partial<{ isOpen: boolean }>) => void;
  setCreatePaymentModal: (value: Partial<{ isOpen: boolean }>) => void;
  setAllocateModal: (value: Partial<{ isOpen: boolean; payment: FinancePayment | null }>) => void;
  setVoidModal: (value: Partial<{ isOpen: boolean; target: VoidTarget | null }>) => void;
  fetchFinance: (childId: string) => Promise<void>;
  suggestAllocation: (childId: string, dto: AllocationSuggestionDto) => Promise<AllocationSuggestion>;
  createCharge: (childId: string, dto: CreateChargeDto) => Promise<void>;
  createPayment: (childId: string, dto: CreatePaymentDto) => Promise<void>;
  allocate: (paymentId: string, dto: AllocateDto) => Promise<void>;
  voidRecord: (target: VoidTarget, reason: string) => Promise<void>;
}

const voidRequests = {
  charge: financeApi.voidCharge,
  payment: financeApi.voidPayment,
  allocation: financeApi.voidAllocation,
};

export const useChildFinanceStore = create<ChildFinanceState>((set) => {
  const applyMutation = async (request: () => Promise<{ data: ChildFinance }>) => {
    set({ isSaving: true });
    try {
      const { data } = await request();
      set({ finance: data });
      try {
        const { data: history } = await financeApi.getHistory(data.child.id);
        set({ history });
      } catch {
        // History refresh is best-effort; the mutation already succeeded.
      }
    } finally {
      set({ isSaving: false });
    }
  };

  return {
    finance: null,
    history: [],
    isLoading: false,
    isSaving: false,
    createChargeModal: { isOpen: false },
    createPaymentModal: { isOpen: false },
    allocateModal: { isOpen: false, payment: null },
    voidModal: { isOpen: false, target: null },

    setCreateChargeModal: (value) =>
      set((state) => ({ createChargeModal: { ...state.createChargeModal, ...value } })),

    setCreatePaymentModal: (value) =>
      set((state) => ({ createPaymentModal: { ...state.createPaymentModal, ...value } })),

    setAllocateModal: (value) =>
      set((state) => ({ allocateModal: { ...state.allocateModal, ...value } })),

    setVoidModal: (value) => set((state) => ({ voidModal: { ...state.voidModal, ...value } })),

    fetchFinance: async (childId) => {
      set({ isLoading: true });
      try {
        const [{ data: finance }, { data: history }] = await Promise.all([
          financeApi.getChildFinance(childId),
          financeApi.getHistory(childId),
        ]);
        set({ finance, history });
      } finally {
        set({ isLoading: false });
      }
    },

    suggestAllocation: async (childId, dto) => (await financeApi.suggest(childId, dto)).data,

    createCharge: (childId, dto) => applyMutation(() => financeApi.createCharge(childId, dto)),

    createPayment: (childId, dto) => applyMutation(() => financeApi.createPayment(childId, dto)),

    allocate: (paymentId, dto) => applyMutation(() => financeApi.allocate(paymentId, dto)),

    voidRecord: (target, reason) =>
      applyMutation(() => voidRequests[target.kind](target.id, { reason })),
  };
});
