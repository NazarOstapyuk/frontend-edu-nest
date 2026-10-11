import { create } from 'zustand';
import {
  billingApi,
  tariffsApi,
  type AddTariffPriceDto,
  type BillResult,
  type BillingProblem,
  type CreateTariffDto,
  type Tariff,
  type UpdateTariffDto,
} from '../../../shared/api';

interface TariffsState {
  tariffs: Tariff[];
  problems: BillingProblem[];
  leadDays: number | null;
  lastRun: BillResult | null;
  isLoading: boolean;
  isSaving: boolean;
  createTariffModal: { isOpen: boolean };
  tariffModal: { isOpen: boolean; tariffId: string | null };
  setCreateTariffModal: (value: Partial<{ isOpen: boolean }>) => void;
  setTariffModal: (value: Partial<{ isOpen: boolean; tariffId: string | null }>) => void;
  fetchAll: () => Promise<void>;
  createTariff: (dto: CreateTariffDto) => Promise<void>;
  updateTariff: (id: string, dto: UpdateTariffDto) => Promise<void>;
  addPrice: (id: string, dto: AddTariffPriceDto) => Promise<void>;
  setLeadDays: (value: number) => Promise<void>;
  runBilling: () => Promise<void>;
}

const replaceTariff = (tariffs: Tariff[], updated: Tariff) =>
  tariffs.map((t) => (t.id === updated.id ? updated : t));

export const useTariffsStore = create<TariffsState>((set) => ({
  tariffs: [],
  problems: [],
  leadDays: null,
  lastRun: null,
  isLoading: false,
  isSaving: false,
  createTariffModal: { isOpen: false },
  tariffModal: { isOpen: false, tariffId: null },

  setCreateTariffModal: (value) =>
    set((state) => ({ createTariffModal: { ...state.createTariffModal, ...value } })),

  setTariffModal: (value) => set((state) => ({ tariffModal: { ...state.tariffModal, ...value } })),

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [{ data: tariffs }, { data: problems }, { data: settings }] = await Promise.all([
        tariffsApi.getList(),
        billingApi.getProblems(),
        billingApi.getSettings(),
      ]);
      set({ tariffs, problems, leadDays: settings.chargeLeadDays });
    } finally {
      set({ isLoading: false });
    }
  },

  createTariff: async (dto) => {
    set({ isSaving: true });
    try {
      const { data } = await tariffsApi.create(dto);
      set((state) => ({ tariffs: [...state.tariffs, data] }));
    } finally {
      set({ isSaving: false });
    }
  },

  updateTariff: async (id, dto) => {
    set({ isSaving: true });
    try {
      const { data } = await tariffsApi.update(id, dto);
      set((state) => ({ tariffs: replaceTariff(state.tariffs, data) }));
    } finally {
      set({ isSaving: false });
    }
  },

  addPrice: async (id, dto) => {
    set({ isSaving: true });
    try {
      const { data } = await tariffsApi.addPrice(id, dto);
      set((state) => ({ tariffs: replaceTariff(state.tariffs, data) }));
    } finally {
      set({ isSaving: false });
    }
  },

  setLeadDays: async (value) => {
    set({ isSaving: true });
    try {
      const { data } = await billingApi.updateSettings({ chargeLeadDays: value });
      set({ leadDays: data.chargeLeadDays });
    } finally {
      set({ isSaving: false });
    }
  },

  runBilling: async () => {
    set({ isSaving: true });
    try {
      const { data } = await billingApi.run();
      const { data: problems } = await billingApi.getProblems();
      set({ lastRun: data, problems });
    } finally {
      set({ isSaving: false });
    }
  },
}));
