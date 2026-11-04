import { create } from 'zustand';
import {
  classGroupsApi,
  directionsApi,
  packagesApi,
  softList,
  tariffsApi,
  usersApi,
  type ClassGroupDto,
  type ClassGroupSummary,
  type Direction,
  type DirectionDto,
  type ReconciliationItem,
  type Tariff,
  type UserLookup,
} from '../../../shared/api';

interface ClassesState {
  directions: Direction[];
  tariffs: Tariff[];
  teachers: UserLookup[];
  reconciliation: ReconciliationItem[];
  isLoading: boolean;
  isSaving: boolean;
  directionModal: { isOpen: boolean; direction: Direction | null };
  groupModal: { isOpen: boolean; directionId: string | null; group: ClassGroupSummary | null; defaultName: string };
  reconciliationOpen: boolean;
  setDirectionModal: (value: Partial<{ isOpen: boolean; direction: Direction | null }>) => void;
  setGroupModal: (
    value: Partial<{ isOpen: boolean; directionId: string | null; group: ClassGroupSummary | null; defaultName: string }>,
  ) => void;
  setReconciliationOpen: (open: boolean) => void;
  fetchAll: () => Promise<void>;
  saveDirection: (dto: DirectionDto, id?: string) => Promise<void>;
  saveGroup: (dto: ClassGroupDto, id?: string) => Promise<void>;
  saveCircle: (direction: Direction, dto: DirectionDto, group?: Partial<ClassGroupDto>) => Promise<void>;
  setDirectionActive: (id: string, isActive: boolean) => Promise<void>;
  deleteDirection: (id: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  migrateLegacy: () => Promise<void>;
}

export const useClassesStore = create<ClassesState>((set, get) => {
  const refreshDirections = async () => {
    const [{ data: directions }, { data: reconciliation }] = await Promise.all([
      directionsApi.getList(),
      packagesApi.getReconciliation(),
    ]);
    set({ directions, reconciliation });
  };

  return {
    directions: [],
    tariffs: [],
    teachers: [],
    reconciliation: [],
    isLoading: false,
    isSaving: false,
    directionModal: { isOpen: false, direction: null },
    groupModal: { isOpen: false, directionId: null, group: null, defaultName: '' },
    reconciliationOpen: false,

    setDirectionModal: (value) => set((state) => ({ directionModal: { ...state.directionModal, ...value } })),
    setGroupModal: (value) => set((state) => ({ groupModal: { ...state.groupModal, ...value } })),
    setReconciliationOpen: (open) => set({ reconciliationOpen: open }),

    fetchAll: async () => {
      set({ isLoading: true });
      try {
        const [tariffs, users] = await Promise.all([softList(tariffsApi.getList()), softList(usersApi.lookup('teacher'))]);
        set({ tariffs, teachers: users });
        await refreshDirections();
      } finally {
        set({ isLoading: false });
      }
    },

    saveDirection: async (dto, id) => {
      set({ isSaving: true });
      try {
        const { data } = id ? await directionsApi.update(id, dto) : await directionsApi.create(dto);
        set({ directions: data });
      } finally {
        set({ isSaving: false });
      }
    },

    saveGroup: async (dto, id) => {
      set({ isSaving: true });
      try {
        if (id) await classGroupsApi.update(id, dto);
        else await classGroupsApi.create(dto);
        await refreshDirections().catch(() => undefined);
      } finally {
        set({ isSaving: false });
      }
    },

    saveCircle: async (direction, dto, group) => {
      set({ isSaving: true });
      try {
        const single = direction.groups.length === 1 ? direction.groups[0] : null;
        if (single && group) await classGroupsApi.update(single.id, group);
        try {
          const { data } = await directionsApi.update(direction.id, dto);
          set({ directions: data });
        } catch (error) {
          if (single && group) {
            if (group.name !== undefined && group.name !== single.name)
              await classGroupsApi.update(single.id, { name: single.name }).catch(() => undefined);
            await refreshDirections().catch(() => undefined);
          }
          throw error;
        }
      } finally {
        set({ isSaving: false });
      }
    },

    setDirectionActive: async (id, isActive) => {
      set({ isSaving: true });
      try {
        const { data } = await directionsApi.update(id, { isActive });
        set({ directions: data });
      } finally {
        set({ isSaving: false });
      }
    },

    deleteDirection: async (id) => {
      set({ isSaving: true });
      try {
        await directionsApi.delete(id);
        await refreshDirections().catch(() => undefined);
      } finally {
        set({ isSaving: false });
      }
    },

    deleteGroup: async (id) => {
      set({ isSaving: true });
      try {
        await classGroupsApi.delete(id);
        await refreshDirections().catch(() => undefined);
      } finally {
        set({ isSaving: false });
      }
    },

    migrateLegacy: async () => {
      set({ isSaving: true });
      try {
        await packagesApi.migrateLegacy();
        await refreshDirections().catch(() => undefined);
        set({ reconciliationOpen: get().reconciliation.length > 0 });
      } finally {
        set({ isSaving: false });
      }
    },
  };
});
