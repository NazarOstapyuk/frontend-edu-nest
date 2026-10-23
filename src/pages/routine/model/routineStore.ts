import { create } from 'zustand';
import {
  addDaysIso,
  kyivNow,
  routineApi,
  weekStart,
  type RoutineGroup,
  type RoutineDay,
  type RoutineDayDto,
} from '../../../shared/api';


interface RoutineState {
  groups: RoutineGroup[];
  groupsLoaded: boolean;
  groupId: string | null;
  weekFrom: string;
  days: RoutineDay[];
  isLoading: boolean;
  isSaving: boolean;
  metaError: boolean;
  loadError: boolean;
  dayDialog: { isOpen: boolean; day: RoutineDay | null };
  loadMeta: () => Promise<void>;
  selectGroup: (groupId: string) => void;
  shiftWeek: (weeks: number) => void;
  load: () => Promise<void>;
  saveDay: (date: string, dto: RoutineDayDto) => Promise<void>;
  resetDay: (date: string) => Promise<void>;
  setDayDialog: (patch: Partial<RoutineState['dayDialog']>) => void;
}

let loadTicket = 0;

const replaceDay = (days: RoutineDay[], next: RoutineDay) => days.map((d) => (d.date === next.date ? next : d));

export const useRoutineStore = create<RoutineState>((set, get) => ({
  groups: [],
  groupsLoaded: false,
  groupId: null,
  weekFrom: weekStart(kyivNow().date),
  days: [],
  isLoading: false,
  isSaving: false,
  metaError: false,
  loadError: false,
  dayDialog: { isOpen: false, day: null },
  loadMeta: async () => {
    set({ metaError: false, groupsLoaded: false, days: [] });
    try {
      const { data: groups } = await routineApi.getGroups();
      const current = get().groupId;
      set({
        groups,
        groupsLoaded: true,
        groupId: groups.some((g) => g.id === current) ? current : (groups[0]?.id ?? null),
      });
    } catch (error) {
      set({ metaError: true });
      throw error;
    }
  },
  selectGroup: (groupId) => set({ groupId, days: [] }),
  shiftWeek: (weeks) => set({ weekFrom: addDaysIso(get().weekFrom, weeks * 7), days: [] }),
  load: async () => {
    const { groupId, weekFrom, groupsLoaded, groups } = get();
    if (!groupsLoaded || !groupId || !groups.some((g) => g.id === groupId)) return;
    const ticket = ++loadTicket;
    set({ isLoading: true, loadError: false });
    try {
      const { data } = await routineApi.getRoutine(groupId, weekFrom, addDaysIso(weekFrom, 6));
      if (ticket === loadTicket) set({ days: data.days });
    } catch (error) {
      if (ticket === loadTicket) set({ loadError: true, days: [] });
      throw error;
    } finally {
      if (ticket === loadTicket) set({ isLoading: false });
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
