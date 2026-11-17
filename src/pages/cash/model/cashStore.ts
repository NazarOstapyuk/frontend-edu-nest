import { create } from 'zustand';
import {
  cashApi,
  type CashCountDto,
  type CashDeskState,
  type CashEntryView,
  type CashShiftReport,
  type CreateCashCorrectionDto,
  type CreateCashEntryDto,
  type Person,
} from '../../../shared/api';

type CountMode = 'open' | 'close';
type WithdrawKind = 'expense' | 'transfer';

interface CountDialogState {
  isOpen: boolean;
  mode: CountMode;
  desk: CashDeskState | null;
}

interface WithdrawDialogState {
  isOpen: boolean;
  kind: WithdrawKind;
  desk: CashDeskState | null;
}

interface DeskDialogState {
  isOpen: boolean;
  desk: CashDeskState | null;
}

interface VoidDialogState {
  isOpen: boolean;
  entry: CashEntryView | null;
}

interface CashState {
  desks: CashDeskState[];
  shiftReports: Record<string, CashShiftReport>;
  recipients: Person[];
  isLoaded: boolean;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  countDialog: CountDialogState;
  withdrawDialog: WithdrawDialogState;
  correctionDialog: DeskDialogState;
  acceptDialog: DeskDialogState;
  voidDialog: VoidDialogState;
  setCountDialog: (value: Partial<CountDialogState>) => void;
  setWithdrawDialog: (value: Partial<WithdrawDialogState>) => void;
  setCorrectionDialog: (value: Partial<DeskDialogState>) => void;
  setAcceptDialog: (value: Partial<DeskDialogState>) => void;
  setVoidDialog: (value: Partial<VoidDialogState>) => void;
  fetchDesks: () => Promise<void>;
  reload: () => Promise<void>;
  fetchRecipients: () => Promise<void>;
  openShift: (deskId: string, dto: CashCountDto) => Promise<CashShiftReport>;
  closeShift: (shiftId: string, dto: CashCountDto) => Promise<CashShiftReport>;
  createEntry: (deskId: string, dto: CreateCashEntryDto) => Promise<void>;
  createCorrection: (deskId: string, dto: CreateCashCorrectionDto) => Promise<void>;
  voidEntry: (id: string, reason: string) => Promise<void>;
}

const loadState = async () => {
  const desks = await cashApi.getDesks();
  const reports = await Promise.all(
    desks.flatMap((desk) => (desk.openShift ? [cashApi.getShift(desk.openShift.id)] : [])),
  );
  const shiftReports: Record<string, CashShiftReport> = {};
  reports.forEach((report) => {
    shiftReports[report.shift.id] = report;
  });
  return { desks, shiftReports };
};

export const useCashStore = create<CashState>((set, get) => ({
  desks: [],
  shiftReports: {},
  recipients: [],
  isLoaded: false,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  countDialog: { isOpen: false, mode: 'open', desk: null },
  withdrawDialog: { isOpen: false, kind: 'expense', desk: null },
  correctionDialog: { isOpen: false, desk: null },
  acceptDialog: { isOpen: false, desk: null },
  voidDialog: { isOpen: false, entry: null },

  setCountDialog: (value) => set((state) => ({ countDialog: { ...state.countDialog, ...value } })),
  setWithdrawDialog: (value) =>
    set((state) => ({ withdrawDialog: { ...state.withdrawDialog, ...value } })),
  setCorrectionDialog: (value) =>
    set((state) => ({ correctionDialog: { ...state.correctionDialog, ...value } })),
  setAcceptDialog: (value) => set((state) => ({ acceptDialog: { ...state.acceptDialog, ...value } })),
  setVoidDialog: (value) => set((state) => ({ voidDialog: { ...state.voidDialog, ...value } })),

  fetchDesks: async () => {
    set({ isLoading: true });
    try {
      set({ ...(await loadState()), isLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },

  reload: async () => {
    set(await loadState());
  },

  fetchRecipients: async () => {
    const recipients = await cashApi.getRecipients();
    set({ recipients });
  },

  openShift: async (deskId, dto) => {
    set({ isCreating: true });
    try {
      const report = await cashApi.openShift(deskId, dto);
      await get().reload().catch(() => undefined);
      return report;
    } finally {
      set({ isCreating: false });
    }
  },

  closeShift: async (shiftId, dto) => {
    set({ isUpdating: true });
    try {
      const report = await cashApi.closeShift(shiftId, dto);
      await get().reload().catch(() => undefined);
      return report;
    } finally {
      set({ isUpdating: false });
    }
  },

  createEntry: async (deskId, dto) => {
    set({ isCreating: true });
    try {
      await cashApi.createEntry(deskId, dto);
      await get().reload().catch(() => undefined);
    } finally {
      set({ isCreating: false });
    }
  },

  createCorrection: async (deskId, dto) => {
    set({ isCreating: true });
    try {
      await cashApi.createCorrection(deskId, dto);
      await get().reload().catch(() => undefined);
    } finally {
      set({ isCreating: false });
    }
  },

  voidEntry: async (id, reason) => {
    set({ isDeleting: true });
    try {
      await cashApi.voidEntry(id, reason);
      await get().reload().catch(() => undefined);
    } finally {
      set({ isDeleting: false });
    }
  },
}));
