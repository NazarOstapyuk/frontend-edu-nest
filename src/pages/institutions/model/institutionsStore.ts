import { create } from 'zustand';
import {
  institutionsApi,
  type CreateInstitutionDto,
  type Institution,
  type UpdateInstitutionDto,
} from '../../../shared/api';
import { useInstitutionStore } from '../../../shared/model/institutionStore';

interface InstitutionsState {
  institutions: Institution[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createInstitutionModal: { isOpen: boolean };
  editInstitutionModal: { isOpen: boolean; institution: Institution | null };
  setCreateInstitutionModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditInstitutionModal: (value: Partial<{ isOpen: boolean; institution: Institution | null }>) => void;
  fetchInstitutions: () => Promise<void>;
  createInstitution: (dto: CreateInstitutionDto) => Promise<void>;
  updateInstitution: (id: string, dto: UpdateInstitutionDto) => Promise<void>;
  deleteInstitution: (id: string) => Promise<void>;
}

const syncShared = (institutions: Institution[]) => useInstitutionStore.setState({ institutions });

export const useInstitutionsStore = create<InstitutionsState>((set, get) => ({
  institutions: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createInstitutionModal: { isOpen: false },
  editInstitutionModal: { isOpen: false, institution: null },

  setCreateInstitutionModal: (value) =>
    set((state) => ({ createInstitutionModal: { ...state.createInstitutionModal, ...value } })),

  setEditInstitutionModal: (value) =>
    set((state) => ({ editInstitutionModal: { ...state.editInstitutionModal, ...value } })),

  fetchInstitutions: async () => {
    set({ isLoading: true });
    try {
      const { data } = await institutionsApi.getList();
      set({ institutions: data });
      syncShared(data);
    } finally {
      set({ isLoading: false });
    }
  },

  createInstitution: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await institutionsApi.create(dto);
      const next = [...get().institutions, data];
      set({ institutions: next });
      syncShared(next);
    } finally {
      set({ isCreating: false });
    }
  },

  updateInstitution: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await institutionsApi.update(id, dto);
      const next = get().institutions.map((i) => (i.id === id ? data : i));
      set({ institutions: next });
      syncShared(next);
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteInstitution: async (id) => {
    set({ isDeleting: true });
    try {
      await institutionsApi.delete(id);
      const next = get().institutions.filter((i) => i.id !== id);
      set({ institutions: next });
      syncShared(next);
      if (useInstitutionStore.getState().selectedId === id) useInstitutionStore.getState().select(null);
    } finally {
      set({ isDeleting: false });
    }
  },
}));
