import { create } from 'zustand';
import {
  isGivenTaskClosed,
  isMyTaskClosed,
  staffTasksApi,
  type AssignableUser,
  type CreateStaffTaskDto,
  type GivenTask,
  type MyTask,
  type UpdateStaffTaskDto,
} from '../../../shared/api';
import { usePendingTasksStore } from '../../../shared/model/pendingTasksStore';

interface TaskDialogState {
  isOpen: boolean;
  task: GivenTask | null;
}

interface TasksState {
  mine: MyTask[];
  mineNext: string | null;
  mineLoaded: boolean;
  mineError: boolean;
  isLoadingMoreMine: boolean;
  markingId: string | null;
  given: GivenTask[];
  givenNext: string | null;
  givenLoaded: boolean;
  givenError: boolean;
  givenAll: boolean;
  isLoadingMoreGiven: boolean;
  assignable: AssignableUser[];
  assignableLoaded: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isCancelling: boolean;
  taskDialog: TaskDialogState;
  loadMine: () => Promise<void>;
  loadMoreMine: () => Promise<void>;
  markDone: (id: string) => Promise<void>;
  markUndone: (id: string) => Promise<void>;
  loadGiven: () => Promise<void>;
  loadMoreGiven: () => Promise<void>;
  setGivenAll: (all: boolean) => void;
  loadAssignable: () => Promise<void>;
  createTask: (dto: CreateStaffTaskDto) => Promise<void>;
  updateTask: (id: string, dto: UpdateStaffTaskDto) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  setTaskDialog: (patch: Partial<TaskDialogState>) => void;
}

const refreshSummary = () => {
  usePendingTasksStore.getState().refresh().catch(() => undefined);
};

const byDueAsc = <T extends { dueAt: string }>(a: T, b: T) => a.dueAt.localeCompare(b.dueAt);
const byDueDesc = <T extends { dueAt: string; id: string }>(a: T, b: T) =>
  b.dueAt.localeCompare(a.dueAt) || b.id.localeCompare(a.id);

const placeGiven = (list: GivenTask[], task: GivenTask) => {
  const rest = list.filter((t) => t.id !== task.id);
  const open = rest.filter((t) => !isGivenTaskClosed(t));
  const closed = rest.filter((t) => isGivenTaskClosed(t));
  if (isGivenTaskClosed(task)) return [...open, ...[...closed, task].sort(byDueDesc)];
  return [...[...open, task].sort(byDueAsc), ...closed];
};

const placeMine = (list: MyTask[], task: MyTask) => {
  const rest = list.filter((t) => t.id !== task.id);
  const open = rest.filter((t) => !isMyTaskClosed(t));
  const closed = rest.filter((t) => isMyTaskClosed(t));
  if (isMyTaskClosed(task)) return [...open, ...[...closed, task].sort(byDueDesc)];
  return [...[...open, task].sort(byDueAsc), ...closed];
};

export const useTasksStore = create<TasksState>((set, get) => ({
  mine: [],
  mineNext: null,
  mineLoaded: false,
  mineError: false,
  isLoadingMoreMine: false,
  markingId: null,
  given: [],
  givenNext: null,
  givenLoaded: false,
  givenError: false,
  givenAll: false,
  isLoadingMoreGiven: false,
  assignable: [],
  assignableLoaded: false,
  isCreating: false,
  isUpdating: false,
  isCancelling: false,
  taskDialog: { isOpen: false, task: null },
  loadMine: async () => {
    set({ mineError: false });
    try {
      const { data } = await staffTasksApi.getMine();
      set({ mine: data.items, mineNext: data.nextBefore, mineLoaded: true });
    } catch (error) {
      set({ mineError: true });
      throw error;
    }
  },
  loadMoreMine: async () => {
    const { mineNext } = get();
    if (!mineNext) return;
    set({ isLoadingMoreMine: true });
    try {
      const { data } = await staffTasksApi.getMine(mineNext);
      set((state) => ({
        mine: [...state.mine, ...data.items.filter((t) => !state.mine.some((m) => m.id === t.id))],
        mineNext: data.nextBefore,
      }));
    } finally {
      set({ isLoadingMoreMine: false });
    }
  },
  markDone: async (id) => {
    set({ markingId: id });
    try {
      const { data } = await staffTasksApi.done(id);
      set((state) => ({ mine: placeMine(state.mine, data) }));
      refreshSummary();
    } finally {
      set({ markingId: null });
    }
  },
  markUndone: async (id) => {
    set({ markingId: id });
    try {
      const { data } = await staffTasksApi.undone(id);
      set((state) => ({ mine: placeMine(state.mine, data) }));
      refreshSummary();
    } finally {
      set({ markingId: null });
    }
  },
  loadGiven: async () => {
    const all = get().givenAll;
    set({ givenError: false });
    try {
      const { data } = await staffTasksApi.getGiven(null, all);
      if (get().givenAll === all) set({ given: data.items, givenNext: data.nextBefore, givenLoaded: true });
    } catch (error) {
      if (get().givenAll === all) set({ givenError: true });
      throw error;
    }
  },
  loadMoreGiven: async () => {
    const { givenNext, givenAll } = get();
    if (!givenNext) return;
    set({ isLoadingMoreGiven: true });
    try {
      const { data } = await staffTasksApi.getGiven(givenNext, givenAll);
      if (get().givenAll !== givenAll) return;
      set((state) => ({
        given: [...state.given, ...data.items.filter((t) => !state.given.some((g) => g.id === t.id))],
        givenNext: data.nextBefore,
      }));
    } finally {
      set({ isLoadingMoreGiven: false });
    }
  },
  setGivenAll: (all) => set({ givenAll: all, givenLoaded: false, given: [], givenNext: null }),
  loadAssignable: async () => {
    const { data } = await staffTasksApi.getAssignable();
    set({ assignable: data, assignableLoaded: true });
  },
  createTask: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await staffTasksApi.create(dto);
      set((state) => ({ given: placeGiven(state.given, data) }));
      refreshSummary();
    } finally {
      set({ isCreating: false });
    }
  },
  updateTask: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await staffTasksApi.update(id, dto);
      set((state) => ({ given: placeGiven(state.given, data) }));
      refreshSummary();
    } finally {
      set({ isUpdating: false });
    }
  },
  cancelTask: async (id) => {
    set({ isCancelling: true });
    try {
      const { data } = await staffTasksApi.cancel(id);
      set((state) => ({ given: placeGiven(state.given, data) }));
      refreshSummary();
    } finally {
      set({ isCancelling: false });
    }
  },
  setTaskDialog: (patch) => set({ taskDialog: { ...get().taskDialog, ...patch } }),
}));
