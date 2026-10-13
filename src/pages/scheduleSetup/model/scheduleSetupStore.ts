import { create } from 'zustand';
import {
  childrenApi,
  groupsApi,
  timetableApi,
  type BellSchedule,
  type BellScheduleDto,
  type Child,
  type Group,
  type NamedItem,
  type Subgroup,
  type SubgroupDto,
} from '../../../shared/api';

export type NamedKind = 'subject' | 'room';

interface ScheduleSetupState {
  subjects: NamedItem[];
  rooms: NamedItem[];
  bellSchedules: BellSchedule[];
  classes: Group[];
  children: Child[];
  classId: string | null;
  subgroups: Subgroup[];
  loadFailed: boolean;
  isSaving: boolean;
  load: () => Promise<void>;
  createNamed: (kind: NamedKind, name: string) => Promise<void>;
  updateNamed: (kind: NamedKind, id: string, patch: Partial<Pick<NamedItem, 'name' | 'active'>>) => Promise<void>;
  saveBellSchedule: (id: string | null, dto: Required<Pick<BellScheduleDto, 'name' | 'periods'>>) => Promise<void>;
  setBellActive: (id: string, active: boolean) => Promise<void>;
  selectClass: (classId: string) => Promise<void>;
  saveSubgroup: (id: string | null, dto: Required<Pick<SubgroupDto, 'name' | 'childIds'>>) => Promise<void>;
  setSubgroupActive: (id: string, active: boolean) => Promise<void>;
}

const replace = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export const useScheduleSetupStore = create<ScheduleSetupState>((set, get) => {
  const saving = async (fn: () => Promise<void>) => {
    set({ isSaving: true });
    try {
      await fn();
    } finally {
      set({ isSaving: false });
    }
  };
  return {
    subjects: [],
    rooms: [],
    bellSchedules: [],
    classes: [],
    children: [],
    classId: null,
    subgroups: [],
    loadFailed: false,
    isSaving: false,
    load: async () => {
      set({ loadFailed: false });
      try {
        const [subjects, rooms, bells, groups, children] = await Promise.all([
          timetableApi.getSubjects(),
          timetableApi.getRooms(),
          timetableApi.getBellSchedules(),
          groupsApi.getList(),
          childrenApi.getList(),
        ]);
        set({
          subjects: subjects.data,
          rooms: rooms.data,
          bellSchedules: bells.data,
          classes: groups.data.filter((g) => g.kind === 'school_class'),
          children: children.data,
        });
      } catch (error) {
        set({ loadFailed: true });
        throw error;
      }
    },
    createNamed: (kind, name) =>
      saving(async () => {
        if (kind === 'subject') {
          const { data } = await timetableApi.createSubject(name);
          set((s) => ({ subjects: replace(s.subjects, data) }));
        } else {
          const { data } = await timetableApi.createRoom(name);
          set((s) => ({ rooms: replace(s.rooms, data) }));
        }
      }),
    updateNamed: (kind, id, patch) =>
      saving(async () => {
        if (kind === 'subject') {
          const { data } = await timetableApi.updateSubject(id, patch);
          set((s) => ({ subjects: replace(s.subjects, data) }));
        } else {
          const { data } = await timetableApi.updateRoom(id, patch);
          set((s) => ({ rooms: replace(s.rooms, data) }));
        }
      }),
    saveBellSchedule: (id, dto) =>
      saving(async () => {
        const { data } = id ? await timetableApi.updateBellSchedule(id, dto) : await timetableApi.createBellSchedule(dto);
        set((s) => ({ bellSchedules: replace(s.bellSchedules, data) }));
      }),
    setBellActive: (id, active) =>
      saving(async () => {
        const { data } = await timetableApi.updateBellSchedule(id, { active });
        set((s) => ({ bellSchedules: replace(s.bellSchedules, data) }));
      }),
    selectClass: async (classId) => {
      set({ classId, subgroups: [] });
      const { data } = await timetableApi.getSubgroups(classId);
      if (get().classId === classId) set({ subgroups: data });
    },
    saveSubgroup: (id, dto) =>
      saving(async () => {
        const classId = get().classId;
        if (!classId) return;
        const { data } = id ? await timetableApi.updateSubgroup(id, dto) : await timetableApi.createSubgroup(classId, dto);
        if (get().classId === classId) set((s) => ({ subgroups: replace(s.subgroups, data) }));
      }),
    setSubgroupActive: (id, active) =>
      saving(async () => {
        const { data } = await timetableApi.updateSubgroup(id, { active });
        set((s) => ({ subgroups: replace(s.subgroups, data) }));
      }),
  };
});
