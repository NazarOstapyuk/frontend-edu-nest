import { create } from 'zustand';
import {
  dailyNotesApi,
  institutionsApi,
  localToday,
  noteSetsApi,
  registerApi,
  type CreateNoteSetDto,
  type Institution,
  type NoteSet,
  type NotesChildRow,
  type NotesDay,
  type NotesDayQuestion,
  type NotesGroup,
  type NoteValue,
  type RegisterGroup,
  type SaveNotesAnswerDto,
  type UpdateNoteSetDto,
} from '../../../shared/api';
import { useInstitutionStore } from '../../../shared/model/institutionStore';
import { usePendingNotesStore } from '../../../shared/model/pendingNotesStore';

export type DraftValue = string | boolean | null;

export const draftKey = (childId: string, questionId: string) => `${childId}:${questionId}`;

const NUMBER_RE = /^-?\d{1,8}([.,]\d{1,2})?$/;

export const initialDraft = (question: NotesDayQuestion, row: NotesChildRow): DraftValue => {
  const value = row.answers.find((a) => a.questionId === question.id)?.value ?? null;
  if (question.type === 'yes_no') return typeof value === 'boolean' ? value : null;
  if (question.type === 'choice') return typeof value === 'string' ? value : null;
  if (question.type === 'percent') return typeof value === 'number' ? String(value) : null;
  return value === null ? '' : String(value);
};

export const numberError = (question: NotesDayQuestion, value: DraftValue): string | null => {
  if (question.type !== 'number' || typeof value !== 'string' || value.trim() === '') return null;
  const text = value.trim();
  if (!NUMBER_RE.test(text)) return 'Введіть число, до 2 знаків після коми';
  const number = Number(text.replace(',', '.'));
  if (question.min !== null && number < question.min) return `Не менше ${question.min}`;
  if (question.max !== null && number > question.max) return `Не більше ${question.max}`;
  return null;
};

const toValue = (question: NotesDayQuestion, value: DraftValue): NoteValue => {
  if (question.type === 'yes_no' || question.type === 'choice') return value;
  if (question.type === 'percent') return typeof value === 'string' && value !== '' ? Number(value) : null;
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') return null;
  return question.type === 'number' ? Number(text.replace(',', '.')) : text;
};

export const isChanged = (question: NotesDayQuestion, row: NotesChildRow, value: DraftValue) =>
  toValue(question, value) !== toValue(question, initialDraft(question, row));

interface SetDialogState {
  isOpen: boolean;
  set: NoteSet | null;
}

interface NotesState {
  groups: NotesGroup[];
  groupsLoaded: boolean;
  groupsError: boolean;
  groupId: string | null;
  date: string;
  dateToday: string;
  day: NotesDay | null;
  dayKey: string | null;
  dayError: boolean;
  draft: Record<string, DraftValue>;
  reason: string;
  isSaving: boolean;
  sets: NoteSet[];
  setsLoaded: boolean;
  setsError: boolean;
  institutions: Institution[];
  registerGroups: RegisterGroup[];
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  setDialog: SetDialogState;
  loadGroups: () => Promise<void>;
  selectGroup: (groupId: string) => void;
  setDate: (date: string) => void;
  loadDay: () => Promise<void>;
  setAnswer: (childId: string, questionId: string, value: DraftValue) => void;
  setReason: (reason: string) => void;
  changedAnswers: () => SaveNotesAnswerDto[];
  hasUnsaved: () => boolean;
  followToday: () => void;
  hasInvalid: () => boolean;
  save: () => Promise<void>;
  loadSets: () => Promise<void>;
  createSet: (dto: CreateNoteSetDto) => Promise<void>;
  updateSet: (id: string, dto: UpdateNoteSetDto) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  setSetDialog: (patch: Partial<SetDialogState>) => void;
}

const eachQuestion = (day: NotesDay) =>
  day.children.flatMap((row) =>
    day.sets.flatMap((set) => set.questions.map((question) => ({ row, question }))),
  );

export const useNotesStore = create<NotesState>((set, get) => ({
  groups: [],
  groupsLoaded: false,
  groupsError: false,
  groupId: null,
  date: localToday(),
  dateToday: localToday(),
  day: null,
  dayKey: null,
  dayError: false,
  draft: {},
  reason: '',
  isSaving: false,
  sets: [],
  setsLoaded: false,
  setsError: false,
  institutions: [],
  registerGroups: [],
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  setDialog: { isOpen: false, set: null },
  loadGroups: async () => {
    set({ groupsError: false });
    try {
      const { data: groups } = await dailyNotesApi.getGroups();
      const current = get().groupId;
      set({
        groups,
        groupsLoaded: true,
        groupId: groups.some((g) => g.id === current) ? current : (groups[0]?.id ?? null),
      });
    } catch (error) {
      set({ groupsError: true });
      throw error;
    }
  },
  selectGroup: (groupId) => set({ groupId }),
  setDate: (date) => set({ date, dateToday: localToday() }),
  followToday: () => {
    const { date, dateToday, hasUnsaved } = get();
    const today = localToday();
    if (date === dateToday && today !== dateToday && !hasUnsaved()) set({ date: today, dateToday: today });
  },
  loadDay: async () => {
    const { groupId, date, dayKey } = get();
    if (!groupId) return;
    const key = `${groupId}/${date}`;
    set(key === dayKey ? { day: null, dayError: false } : { dayKey: key, day: null, draft: {}, reason: '', dayError: false });
    try {
      const { data } = await dailyNotesApi.getDay(groupId, date);
      if (get().dayKey === key) set({ day: data });
    } catch (error) {
      if (get().dayKey === key) set({ dayError: true });
      throw error;
    }
  },
  setAnswer: (childId, questionId, value) =>
    set((state) => ({ draft: { ...state.draft, [draftKey(childId, questionId)]: value } })),
  setReason: (reason) => set({ reason }),
  changedAnswers: () => {
    const { day, draft } = get();
    if (!day) return [];
    return eachQuestion(day).flatMap(({ row, question }) => {
      const key = draftKey(row.child.id, question.id);
      if (!(key in draft) || !isChanged(question, row, draft[key])) return [];
      return [{ childId: row.child.id, questionId: question.id, value: toValue(question, draft[key]) }];
    });
  },
  hasUnsaved: () => get().changedAnswers().length > 0,
  hasInvalid: () => {
    const { day, draft } = get();
    if (!day) return false;
    return eachQuestion(day).some(({ row, question }) => {
      const key = draftKey(row.child.id, question.id);
      return key in draft && numberError(question, draft[key]) !== null;
    });
  },
  save: async () => {
    const { groupId, day, dayKey, reason, draft: sent } = get();
    if (!groupId || !day) return;
    const answers = get().changedAnswers();
    if (answers.length === 0) return;
    set({ isSaving: true });
    try {
      const { data } = await dailyNotesApi.saveDay(groupId, day.date, {
        reason: day.needsReason ? reason.trim() : undefined,
        answers,
      });
      if (get().dayKey === dayKey) {
        const draft = Object.fromEntries(
          Object.entries(get().draft).filter(([key, value]) => !(key in sent) || sent[key] !== value),
        );
        set({ day: data, draft, reason: '' });
      }
      usePendingNotesStore.getState().refresh().catch(() => undefined);
    } finally {
      set({ isSaving: false });
    }
  },
  loadSets: async () => {
    set({ setsError: false });
    try {
      const [{ data: sets }, { data: institutions }, { data: registerGroups }] = await Promise.all([
        noteSetsApi.getList(),
        institutionsApi.getList(),
        registerApi.getGroups(),
      ]);
      set({ sets, institutions, registerGroups, setsLoaded: true });
    } catch (error) {
      set({ setsError: true });
      throw error;
    }
  },
  createSet: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await noteSetsApi.create(dto);
      set((state) => ({
        sets: [...state.sets, data].sort(
          (a, b) => a.institution.name.localeCompare(b.institution.name) || a.name.localeCompare(b.name),
        ),
      }));
    } finally {
      set({ isCreating: false });
    }
  },
  updateSet: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await noteSetsApi.update(id, dto);
      set((state) => ({ sets: state.sets.map((s) => (s.id === id ? data : s)) }));
    } finally {
      set({ isUpdating: false });
    }
  },
  deleteSet: async (id) => {
    set({ isDeleting: true });
    try {
      await noteSetsApi.delete(id);
      set((state) => ({ sets: state.sets.filter((s) => s.id !== id) }));
    } finally {
      set({ isDeleting: false });
    }
  },
  setSetDialog: (patch) => set({ setDialog: { ...get().setDialog, ...patch } }),
}));

useInstitutionStore.subscribe((state, prev) => {
  if (state.selectedId !== prev.selectedId) useNotesStore.setState({ groupId: null, setsLoaded: false });
});
