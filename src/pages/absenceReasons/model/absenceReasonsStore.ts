import { create } from 'zustand';
import {
  registerApi,
  type AbsenceReason,
  type AbsenceReasonDto,
  type UpdateAbsenceReasonDto,
} from '../../../shared/api';

interface ReasonModal {
  isOpen: boolean;
  reason: AbsenceReason | null;
}

interface AbsenceReasonsState {
  reasons: AbsenceReason[];
  isLoading: boolean;
  isSaving: boolean;
  modal: ReasonModal;
  setModal: (value: Partial<ReasonModal>) => void;
  fetchReasons: () => Promise<void>;
  createReason: (dto: AbsenceReasonDto) => Promise<void>;
  updateReason: (id: string, dto: UpdateAbsenceReasonDto) => Promise<void>;
}

export const useAbsenceReasonsStore = create<AbsenceReasonsState>((set) => ({
  reasons: [],
  isLoading: false,
  isSaving: false,
  modal: { isOpen: false, reason: null },
  setModal: (value) => set((state) => ({ modal: { ...state.modal, ...value } })),
  fetchReasons: async () => {
    set({ isLoading: true });
    try {
      const { data } = await registerApi.getReasons();
      set({ reasons: data });
    } finally {
      set({ isLoading: false });
    }
  },
  createReason: async (dto) => {
    set({ isSaving: true });
    try {
      const { data } = await registerApi.createReason(dto);
      set((state) => ({ reasons: [...state.reasons, data] }));
    } finally {
      set({ isSaving: false });
    }
  },
  updateReason: async (id, dto) => {
    set({ isSaving: true });
    try {
      const { data } = await registerApi.updateReason(id, dto);
      set((state) => ({ reasons: state.reasons.map((r) => (r.id === id ? data : r)) }));
    } finally {
      set({ isSaving: false });
    }
  },
}));
