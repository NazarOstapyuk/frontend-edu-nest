import { create } from 'zustand';
import { financeApi, type BalancesFilters, type FinanceBalance } from '../../../shared/api';

interface FinanceBalancesState {
  balances: FinanceBalance[];
  filters: BalancesFilters;
  isLoading: boolean;
  setFilters: (value: Partial<BalancesFilters>) => void;
  fetchBalances: () => Promise<void>;
}

export const useFinanceBalancesStore = create<FinanceBalancesState>((set, get) => ({
  balances: [],
  filters: {},
  isLoading: false,

  setFilters: (value) => set((state) => ({ filters: { ...state.filters, ...value } })),

  fetchBalances: async () => {
    set({ isLoading: true });
    try {
      const { data } = await financeApi.getBalances(get().filters);
      set({ balances: data });
    } finally {
      set({ isLoading: false });
    }
  },
}));
