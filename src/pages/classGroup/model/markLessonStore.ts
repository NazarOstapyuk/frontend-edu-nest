import { create } from 'zustand';
import { childrenApi, classGroupsApi, type AttendanceStatus, type Child, type LessonRoster } from '../../../shared/api';

interface MarkLessonState {
  key: string | null;
  roster: LessonRoster | null;
  draft: Record<string, AttendanceStatus>;
  guests: Child[];
  allChildren: Child[];
  isLoading: boolean;
  isSaving: boolean;
  load: (groupId: string, date: string, withChildren: boolean) => Promise<void>;
  setStatus: (childId: string, status: AttendanceStatus) => void;
  markPresent: (childIds: string[]) => void;
  addGuest: (child: Child) => void;
  save: (reason?: string) => Promise<void>;
}

const draftFrom = (roster: LessonRoster) =>
  Object.fromEntries(
    roster.rows.filter((r) => r.attendance).map((r) => [r.child.id, (r.attendance as { status: AttendanceStatus }).status]),
  ) as Record<string, AttendanceStatus>;

export const useMarkLessonStore = create<MarkLessonState>((set, get) => ({
  key: null,
  roster: null,
  draft: {},
  guests: [],
  allChildren: [],
  isLoading: false,
  isSaving: false,

  load: async (groupId, date, withChildren) => {
    const key = `${groupId}/${date}`;
    set({ key, roster: null, draft: {}, guests: [], isLoading: true });
    try {
      const [{ data: roster }, allChildren] = await Promise.all([
        classGroupsApi.getRoster(groupId, date),
        withChildren ? childrenApi.getList().then((r) => r.data) : Promise.resolve([] as Child[]),
      ]);
      if (get().key === key) set({ roster, draft: draftFrom(roster), allChildren });
    } finally {
      set({ isLoading: false });
    }
  },

  setStatus: (childId, status) => set((state) => ({ draft: { ...state.draft, [childId]: status } })),

  markPresent: (childIds) =>
    set((state) => ({
      draft: { ...state.draft, ...Object.fromEntries(childIds.filter((id) => !state.draft[id]).map((id) => [id, 'present' as AttendanceStatus])) },
    })),

  addGuest: (child) =>
    set((state) =>
      state.guests.some((g) => g.id === child.id) || state.roster?.rows.some((r) => r.child.id === child.id)
        ? state
        : { guests: [...state.guests, child] },
    ),

  save: async (reason) => {
    const { roster, draft, guests, key } = get();
    if (!roster || !key) return;
    const memberIds = new Set(roster.rows.filter((r) => r.isMember).map((r) => r.child.id));
    const guestIds = new Set([
      ...guests.map((g) => g.id),
      ...roster.rows.filter((r) => r.attendance?.isGuest).map((r) => r.child.id),
    ]);
    const marks = Object.entries(draft).map(([childId, status]) => ({
      childId,
      status,
      isGuest: !memberIds.has(childId) && guestIds.has(childId) ? true : undefined,
    }));
    if (marks.length === 0) return;
    set({ isSaving: true });
    try {
      const { data } = await classGroupsApi.mark(roster.group.id, key.split('/')[1], {
        marks,
        reason: reason || undefined,
      });
      if (get().key === key) set({ roster: data, draft: draftFrom(data), guests: [] });
    } finally {
      set({ isSaving: false });
    }
  },
}));
