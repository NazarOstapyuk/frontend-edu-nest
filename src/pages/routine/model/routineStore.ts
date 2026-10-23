import { create } from 'zustand';
import {
  addDaysIso,
  groupsApi,
  localToday,
  registerApi,
  routineApi,
  weekStart,
  type RoutineDay,
  type RoutineDayDto,
} from '../../../shared/api';

export interface RoutineGroupOption {
  id: string;
  name: string;
}

interface RoutineState {
  groups: RoutineGroupOption[];
  groupId: string | null;
  weekFrom: string;
  days: RoutineDay[];
  isLoading: boolean;
  isSaving: boolean;
  metaError: boolean;
  loadError: boolean;
  dayDialog: { isOpen: boolean; day: RoutineDay | null };
  loadMeta: (useGroupList: boolean) => Promise<void>;
  selectGroup: (groupId: string) => void;
  shiftWeek: (weeks: number) => void;
  load: () => Promise<void>;
  saveDay: (date: string, dto: RoutineDayDto) => Promise<void>;
  resetDay: (date: string) => Promise<void>;
  setDayDialog: (patch: Partial<RoutineState['dayDialog']>) => void;
}

const replaceDay = (days: RoutineDay[], next: RoutineDay) => days.map((d) => (d.date === next.date ? next : d));

export const useRoutineStore = create<RoutineState>((set, get) => ({
  groups: [],
  groupId: null,
  weekFrom: weekStart(localToday()),
  days: [],
  isLoading: false,
  isSaving: false,
  metaError: false,
  loadError: false,
  dayDialog: { isOpen: false, day: null },
  loadMeta: async (useGroupList) => {
    set({ metaError: false });
    try {
      const { data } = useGroupList ? await groupsApi.getList() : await registerApi.getGroups();
      const groups = data
        .filter((g) => g.kind === 'kindergarten')
        .map((g) => ({ id: g.id, name: g.name }));
      const current = get().groupId;
      set({ groups, groupId: groups.some((g) => g.id === current) ? current : (groups[0]?.id ?? null) });
    } catch (error) {
      set({ metaError: true });
      throw error;
    }
  },
  selectGroup: (groupId) => set({ groupId, days: [] }),
  shiftWeek: (weeks) => set({ weekFrom: addDaysIso(get().weekFrom, weeks * 7) }),
  load: async () => {
    const { groupId, weekFrom } = get();
    if (!groupId) return;
    set({ isLoading: true, loadError: false });
    try {
      const { data } = await routineApi.getRoutine(groupId, weekFrom, addDaysIso(weekFrom, 6));
      if (get().groupId === groupId && get().weekFrom === weekFrom) set({ days: data.days });
    } catch (error) {
      if (get().groupId === groupId && get().weekFrom === weekFrom) set({ loadError: true, days: [] });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  saveDay: async (date, dto) => {
    const { groupId } = get();
    if (!groupId) return;
    set({ isSaving: true });
    try {
      const { data } = await routineApi.saveDay(groupId, date, dto);
      set({ days: replaceDay(get().days, data) });
    } finally {
      set({ isSaving: false });
    }
  },
  resetDay: async (date) => {
    const { groupId } = get();
    if (!groupId) return;
    set({ isSaving: true });
    try {
      const { data } = await routineApi.resetDay(groupId, date);
      set({ days: replaceDay(get().days, data) });
    } finally {
      set({ isSaving: false });
    }
  },
  setDayDialog: (patch) => set({ dayDialog: { ...get().dayDialog, ...patch } }),
}));
