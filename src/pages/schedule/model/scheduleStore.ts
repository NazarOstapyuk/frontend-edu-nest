import { create } from 'zustand';
import {
  groupsApi,
  localToday,
  timetableApi,
  usersApi,
  weekStart,
  addDaysIso,
  type BellSchedule,
  type ClassSchedule,
  type Group,
  type LessonChangeDto,
  type NamedItem,
  type ScheduleConflict,
  type Subgroup,
  type TimetableEntry,
  type TimetableVersion,
} from '../../../shared/api';
import type { User } from '../../../entities/user';

interface ScheduleState {
  classes: Group[];
  subjects: NamedItem[];
  rooms: NamedItem[];
  teachers: User[];
  bellSchedules: BellSchedule[];
  metaFailed: boolean;
  classId: string | null;
  classKey: string | null;
  classFailed: boolean;
  subgroups: Subgroup[];
  versions: TimetableVersion[];
  versionId: string | 'new' | null;
  draft: TimetableEntry[];
  newValidFrom: string;
  conflicts: ScheduleConflict[];
  week: string;
  weekData: ClassSchedule | null;
  weekKey: string | null;
  weekFailed: boolean;
  isSaving: boolean;
  loadMeta: () => Promise<void>;
  setClassId: (classId: string) => void;
  selectClass: (classId: string) => Promise<void>;
  selectVersion: (versionId: string) => void;
  startNewVersion: (validFrom: string) => void;
  setDraft: (entries: TimetableEntry[]) => void;
  saveVersion: () => Promise<void>;
  setWeek: (week: string) => void;
  loadWeek: () => Promise<void>;
  createChange: (dto: LessonChangeDto) => Promise<void>;
  voidChange: (id: string, reason: string) => Promise<void>;
}

const currentVersion = (versions: TimetableVersion[]) => {
  const today = localToday();
  return versions.find((v) => v.validFrom <= today && (!v.validTo || v.validTo >= today)) ?? versions[versions.length - 1] ?? null;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  classes: [],
  subjects: [],
  rooms: [],
  teachers: [],
  bellSchedules: [],
  metaFailed: false,
  classId: null,
  classKey: null,
  classFailed: false,
  subgroups: [],
  versions: [],
  versionId: null,
  draft: [],
  newValidFrom: localToday(),
  conflicts: [],
  week: weekStart(localToday()),
  weekData: null,
  weekKey: null,
  weekFailed: false,
  isSaving: false,
  loadMeta: async () => {
    set({ metaFailed: false });
    try {
      const [groups, subjects, rooms, users, bells] = await Promise.all([
        groupsApi.getList(),
        timetableApi.getSubjects(),
        timetableApi.getRooms(),
        usersApi.getList(),
        timetableApi.getBellSchedules(),
      ]);
      const classes = groups.data.filter((g) => g.kind === 'school_class');
      set((state) => ({
        classes,
        subjects: subjects.data,
        rooms: rooms.data,
        teachers: users.data.filter((u) => u.role === 'teacher'),
        bellSchedules: bells.data,
        classId: classes.some((c) => c.id === state.classId) ? state.classId : (classes[0]?.id ?? null),
      }));
    } catch (error) {
      set({ metaFailed: true });
      throw error;
    }
  },
  setClassId: (classId) => set({ classId }),
  selectClass: async (classId) => {
    const key = `${classId}/${Date.now()}`;
    set({ classId, classKey: key, classFailed: false, versions: [], subgroups: [], versionId: null, draft: [], conflicts: [], weekData: null, weekKey: null });
    try {
      const [versions, subgroups] = await Promise.all([timetableApi.getTimetables(classId), timetableApi.getSubgroups(classId)]);
      if (get().classKey !== key) return;
      const current = currentVersion(versions.data);
      set({ versions: versions.data, subgroups: subgroups.data, versionId: current?.id ?? null, draft: current?.entries ?? [] });
    } catch (error) {
      if (get().classKey === key) set({ classFailed: true });
      throw error;
    }
  },
  selectVersion: (versionId) => {
    const version = get().versions.find((v) => v.id === versionId);
    set({ versionId, draft: version?.entries ?? [], conflicts: [] });
  },
  startNewVersion: (validFrom) => {
    const base = currentVersion(get().versions);
    set({ versionId: 'new', newValidFrom: validFrom, draft: base?.entries.map((e) => ({ ...e })) ?? [], conflicts: [] });
  },
  setDraft: (entries) => set({ draft: entries, conflicts: [] }),
  saveVersion: async () => {
    const { classId, versionId, draft, newValidFrom } = get();
    if (!classId || !versionId) return;
    set({ isSaving: true, conflicts: [] });
    try {
      const { data } =
        versionId === 'new'
          ? await timetableApi.createTimetable(classId, newValidFrom, draft)
          : await timetableApi.replaceEntries(versionId, draft);
      const versions = await timetableApi.getTimetables(classId);
      if (get().classId === classId) {
        const saved = versions.data.find((v) => v.id === data.id);
        set({ versions: versions.data, versionId: data.id, draft: saved?.entries ?? [] });
      }
    } catch (error) {
      const conflicts = (error as { conflicts?: ScheduleConflict[] } | null)?.conflicts;
      if (conflicts) set({ conflicts });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },
  setWeek: (week) => set({ week }),
  loadWeek: async () => {
    const { classId, week } = get();
    if (!classId) return;
    const key = `${classId}/${week}`;
    set({ weekKey: key, weekData: null, weekFailed: false });
    try {
      const { data } = await timetableApi.getSchedule(classId, week, addDaysIso(week, 5));
      if (get().weekKey === key) set({ weekData: data });
    } catch (error) {
      if (get().weekKey === key) set({ weekFailed: true });
      throw error;
    }
  },
  createChange: async (dto) => {
    const { classId } = get();
    if (!classId) return;
    set({ isSaving: true });
    try {
      await timetableApi.createChange(classId, dto);
      await get().loadWeek();
    } finally {
      set({ isSaving: false });
    }
  },
  voidChange: async (id, reason) => {
    set({ isSaving: true });
    try {
      await timetableApi.voidChange(id, reason);
      await get().loadWeek();
    } finally {
      set({ isSaving: false });
    }
  },
}));

export const isEditableVersion = (versionId: string | 'new' | null, versions: TimetableVersion[]) =>
  versionId === 'new' || (versions.find((v) => v.id === versionId)?.validFrom ?? '') > localToday();
