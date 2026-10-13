import { create } from 'zustand';
import {
  registerApi,
  timetableApi,
  type AbsenceReason,
  type LessonMarkDto,
  type LessonPupil,
  type LessonStatus,
  type LessonView,
  type NushLevel,
} from '../../../shared/api';

export interface PupilDraft {
  status: LessonStatus | null;
  reasonId: string | null;
  level: NushLevel | null;
  comment: string;
}

export const pupilBaseline = (p: LessonPupil): PupilDraft => {
  if (p.mark) return { status: p.mark.status, reasonId: p.mark.reasonId, level: p.mark.level, comment: p.mark.comment ?? '' };
  if (p.state.source === 'register') return { status: 'absent', reasonId: p.state.reasonId, level: null, comment: '' };
  return { status: null, reasonId: null, level: null, comment: '' };
};

export const sameDraft = (a: PupilDraft, b: PupilDraft) =>
  a.status === b.status && a.reasonId === b.reasonId && a.level === b.level && a.comment.trim() === b.comment.trim();

interface LessonRef {
  groupId: string;
  date: string;
  period: number;
  subgroupId?: string;
}

interface LessonState {
  key: string | null;
  ref: LessonRef | null;
  view: LessonView | null;
  reasons: AbsenceReason[];
  draft: Record<string, PupilDraft>;
  topic: string;
  homework: string;
  loadFailed: boolean;
  isSaving: boolean;
  load: (ref: LessonRef) => Promise<void>;
  setPupil: (childId: string, patch: Partial<PupilDraft>) => void;
  setTopic: (topic: string) => void;
  setHomework: (homework: string) => void;
  markAllPresent: () => void;
  save: (reason?: string) => Promise<void>;
}

const keyOf = (r: LessonRef) => `${r.groupId}/${r.date}/${r.period}/${r.subgroupId ?? 'class'}`;

const fromView = (view: LessonView) => ({
  view,
  draft: Object.fromEntries(view.pupils.map((p) => [p.child.id, pupilBaseline(p)])),
  topic: view.lesson?.topic ?? '',
  homework: view.lesson?.homework ?? '',
});

export const useLessonStore = create<LessonState>((set, get) => ({
  key: null,
  ref: null,
  view: null,
  reasons: [],
  draft: {},
  topic: '',
  homework: '',
  loadFailed: false,
  isSaving: false,
  load: async (ref) => {
    const key = keyOf(ref);
    set({ key, ref, view: null, draft: {}, loadFailed: false });
    try {
      const [{ data }, { data: reasons }] = await Promise.all([
        timetableApi.getLesson(ref.groupId, ref.date, ref.period, ref.subgroupId),
        registerApi.getReasons(),
      ]);
      if (get().key === key) set({ ...fromView(data), reasons });
    } catch (error) {
      if (get().key === key) set({ loadFailed: true });
      throw error;
    }
  },
  setPupil: (childId, patch) =>
    set((state) => {
      const next = { ...state.draft[childId], ...patch };
      if (next.status !== 'absent') next.reasonId = null;
      if (next.status === 'absent') next.level = null;
      return { draft: { ...state.draft, [childId]: next } };
    }),
  setTopic: (topic) => set({ topic }),
  setHomework: (homework) => set({ homework }),
  markAllPresent: () =>
    set((state) => ({
      draft: Object.fromEntries(
        Object.entries(state.draft).map(([id, d]) => [id, d.status ? d : { ...d, status: 'present' as const }]),
      ),
    })),
  save: async (reason) => {
    const { ref, view, draft, topic, homework, key } = get();
    if (!ref || !view) return;
    const marks: LessonMarkDto[] = view.pupils.flatMap((p) => {
      const d = draft[p.child.id];
      if (!d?.status || sameDraft(d, pupilBaseline(p))) return [];
      return [{
        childId: p.child.id,
        status: d.status,
        reasonId: d.status === 'absent' && d.reasonId ? d.reasonId : undefined,
        level: d.status !== 'absent' && d.level ? d.level : undefined,
        comment: d.comment.trim() || undefined,
      }];
    });
    const topicChanged = topic.trim() !== (view.lesson?.topic ?? '');
    const homeworkChanged = homework.trim() !== (view.lesson?.homework ?? '');
    if (!marks.length && !topicChanged && !homeworkChanged) return;
    set({ isSaving: true });
    try {
      const { data } = await timetableApi.saveLesson(ref.groupId, ref.date, ref.period, ref.subgroupId, {
        topic: topicChanged ? topic.trim() : undefined,
        homework: homeworkChanged ? homework.trim() : undefined,
        reason,
        marks,
      });
      if (get().key === key) set(fromView(data));
    } finally {
      set({ isSaving: false });
    }
  },
}));
