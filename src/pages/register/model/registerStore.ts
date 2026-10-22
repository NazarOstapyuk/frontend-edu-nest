import { create } from 'zustand';
import { useInstitutionStore } from '../../../shared/model/institutionStore';
import {
  localToday,
  registerApi,
  type AbsenceReason,
  type DailyStatus,
  type RegisterDay,
  type RegisterGroup,
  type RegisterMarkDto,
  type RegisterMonth,
  type RegisterRow,
} from '../../../shared/api';

export interface RowDraft {
  status: DailyStatus | null;
  reasonId: string | null;
  note: string;
  documentProvided: boolean;
}

export const rowDraft = (row: RegisterRow): RowDraft => {
  if (row.mark) {
    return {
      status: row.mark.status,
      reasonId: row.mark.reasonId,
      note: row.mark.note ?? '',
      documentProvided: row.mark.documentProvided,
    };
  }
  if (row.notice) return { status: 'absent', reasonId: row.notice.reasonId, note: '', documentProvided: false };
  return { status: null, reasonId: null, note: '', documentProvided: false };
};

export const sameDraft = (a: RowDraft, b: RowDraft) =>
  a.status === b.status && a.reasonId === b.reasonId && a.note.trim() === b.note.trim() && a.documentProvided === b.documentProvided;

const draftsOf = (day: RegisterDay) =>
  Object.fromEntries(day.children.map((row) => [row.child.id, rowDraft(row)]));

interface RegisterState {
  groups: RegisterGroup[];
  reasons: AbsenceReason[];
  allReasons: AbsenceReason[];
  groupId: string | null;
  date: string;
  month: string;
  day: RegisterDay | null;
  dayKey: string | null;
  draft: Record<string, RowDraft>;
  monthData: RegisterMonth | null;
  monthKey: string | null;
  isSaving: boolean;
  metaError: boolean;
  dayError: boolean;
  monthError: boolean;
  loadMeta: () => Promise<void>;
  selectGroup: (groupId: string) => void;
  setDate: (date: string) => void;
  setMonth: (month: string) => void;
  loadDay: () => Promise<void>;
  loadMonth: () => Promise<void>;
  setDraft: (childId: string, patch: Partial<RowDraft>) => void;
  markAllPresent: () => void;
  save: (reason?: string) => Promise<void>;
}

export const useRegisterStore = create<RegisterState>((set, get) => ({
  groups: [],
  reasons: [],
  allReasons: [],
  groupId: null,
  date: localToday(),
  month: localToday().slice(0, 7),
  day: null,
  dayKey: null,
  draft: {},
  monthData: null,
  monthKey: null,
  isSaving: false,
  metaError: false,
  dayError: false,
  monthError: false,
  loadMeta: async () => {
    set({ metaError: false });
    try {
      const [{ data: groups }, { data: reasons }] = await Promise.all([
        registerApi.getGroups(),
        registerApi.getReasons(),
      ]);
      set((state) => ({
        groups,
        reasons: reasons.filter((r) => r.active),
        allReasons: reasons,
        groupId: groups.some((g) => g.id === state.groupId) ? state.groupId : (groups[0]?.id ?? null),
      }));
    } catch {
      set({ metaError: true });
    }
  },
  selectGroup: (groupId) => set({ groupId }),
  setDate: (date) => set({ date, month: date.slice(0, 7) }),
  setMonth: (month) => set({ month }),
  loadDay: async () => {
    const { groupId, date } = get();
    if (!groupId) return;
    const key = `${groupId}/${date}`;
    set({ dayKey: key, day: null, draft: {}, dayError: false });
    try {
      const { data } = await registerApi.getDay(groupId, date);
      if (get().dayKey === key) set({ day: data, draft: draftsOf(data) });
    } catch {
      if (get().dayKey === key) set({ dayError: true });
    }
  },
  loadMonth: async () => {
    const { groupId, month } = get();
    if (!groupId) return;
    const key = `${groupId}/${month}`;
    set({ monthKey: key, monthData: null, monthError: false });
    try {
      const { data } = await registerApi.getMonth(groupId, month);
      if (get().monthKey === key) set({ monthData: data });
    } catch {
      if (get().monthKey === key) set({ monthError: true });
    }
  },
  setDraft: (childId, patch) =>
    set((state) => {
      const next = { ...state.draft[childId], ...patch };
      if (next.status !== 'absent') {
        next.reasonId = null;
        next.documentProvided = false;
      }
      return { draft: { ...state.draft, [childId]: next } };
    }),
  markAllPresent: () =>
    set((state) => ({
      draft: Object.fromEntries(
        Object.entries(state.draft).map(([id, d]) => [id, d.status ? d : { ...d, status: 'present' as const }]),
      ),
    })),
  save: async (reason) => {
    const { groupId, day, draft, dayKey } = get();
    if (!groupId || !day) return;
    const marks: RegisterMarkDto[] = day.children.flatMap((row) => {
      const d = draft[row.child.id];
      if (!d?.status || sameDraft(d, rowDraft(row))) return [];
      const absent = d.status === 'absent';
      return [{
        childId: row.child.id,
        status: d.status,
        reasonId: absent && d.reasonId ? d.reasonId : undefined,
        note: d.note.trim() || undefined,
        documentProvided: absent ? d.documentProvided : undefined,
      }];
    });
    if (marks.length === 0) return;
    set({ isSaving: true });
    try {
      const { data } = await registerApi.saveDay(groupId, { date: day.date, reason, marks });
      if (get().dayKey === dayKey) set({ day: data, draft: draftsOf(data) });
      set({ monthKey: null, monthData: null });
    } finally {
      set({ isSaving: false });
    }
  },
}));

useInstitutionStore.subscribe((state, prev) => {
  if (state.selectedId !== prev.selectedId) useRegisterStore.setState({ groupId: null });
});
