import { create } from 'zustand';
import {
  enrollmentsApi,
  tariffsApi,
  type CreateAdjustmentDto,
  type CreateEnrollmentDto,
  type Enrollment,
  type Tariff,
} from '../../../shared/api';
import { useChildFinanceStore } from './childFinanceStore';

export type EnrollmentReasonTarget =
  | { kind: 'adjustment'; id: string; title: string }
  | { kind: 'recalculate'; id: string; title: string };

interface EnrollmentsState {
  childId: string | null;
  enrollments: Enrollment[];
  tariffOptions: Tariff[];
  isLoading: boolean;
  isSaving: boolean;
  createEnrollmentModal: { isOpen: boolean };
  endEnrollmentModal: { isOpen: boolean; enrollment: Enrollment | null };
  adjustmentModal: { isOpen: boolean; enrollment: Enrollment | null };
  reasonTarget: EnrollmentReasonTarget | null;
  setCreateEnrollmentModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEndEnrollmentModal: (value: Partial<{ isOpen: boolean; enrollment: Enrollment | null }>) => void;
  setAdjustmentModal: (value: Partial<{ isOpen: boolean; enrollment: Enrollment | null }>) => void;
  setReasonTarget: (target: EnrollmentReasonTarget | null) => void;
  fetchEnrollments: (childId: string) => Promise<void>;
  createEnrollment: (dto: CreateEnrollmentDto) => Promise<void>;
  endEnrollment: (id: string, endDate: string) => Promise<void>;
  addAdjustment: (id: string, dto: CreateAdjustmentDto) => Promise<void>;
  submitReason: (reason: string) => Promise<void>;
  billNow: (id: string) => Promise<void>;
}

export const useEnrollmentsStore = create<EnrollmentsState>((set, get) => {
  const mutate = async (request: () => Promise<Enrollment[]>) => {
    const childId = get().childId;
    set({ isSaving: true });
    try {
      const enrollments = await request();
      if (get().childId === childId) {
        set({ enrollments });
        if (childId) await useChildFinanceStore.getState().fetchFinance(childId).catch(() => undefined);
      }
    } finally {
      set({ isSaving: false });
    }
  };

  const requireChild = () => {
    const { childId } = get();
    if (!childId) throw new Error('Child is not selected');
    return childId;
  };

  return {
    childId: null,
    enrollments: [],
    tariffOptions: [],
    isLoading: false,
    isSaving: false,
    createEnrollmentModal: { isOpen: false },
    endEnrollmentModal: { isOpen: false, enrollment: null },
    adjustmentModal: { isOpen: false, enrollment: null },
    reasonTarget: null,

    setCreateEnrollmentModal: (value) =>
      set((state) => ({ createEnrollmentModal: { ...state.createEnrollmentModal, ...value } })),

    setEndEnrollmentModal: (value) =>
      set((state) => ({ endEnrollmentModal: { ...state.endEnrollmentModal, ...value } })),

    setAdjustmentModal: (value) =>
      set((state) => ({ adjustmentModal: { ...state.adjustmentModal, ...value } })),

    setReasonTarget: (target) => set({ reasonTarget: target }),

    fetchEnrollments: async (childId) => {
      set({ isLoading: true, childId, enrollments: [] });
      try {
        const [{ data: enrollments }, { data: tariffs }] = await Promise.all([
          enrollmentsApi.getByChild(childId),
          tariffsApi.getList(),
        ]);
        if (get().childId === childId) set({ enrollments, tariffOptions: tariffs });
      } finally {
        set({ isLoading: false });
      }
    },

    createEnrollment: (dto) =>
      mutate(async () => (await enrollmentsApi.create(requireChild(), dto)).data),

    endEnrollment: (id, endDate) => mutate(async () => (await enrollmentsApi.end(id, { endDate })).data),

    addAdjustment: (id, dto) => mutate(async () => (await enrollmentsApi.addAdjustment(id, dto)).data),

    submitReason: async (reason) => {
      const target = get().reasonTarget;
      if (!target) return;
      await mutate(async () =>
        target.kind === 'adjustment'
          ? (await enrollmentsApi.voidAdjustment(target.id, reason)).data
          : (await enrollmentsApi.recalculate(target.id, reason)).data,
      );
    },

    billNow: (id) => mutate(async () => (await enrollmentsApi.bill(id)).data.enrollments),
  };
});
