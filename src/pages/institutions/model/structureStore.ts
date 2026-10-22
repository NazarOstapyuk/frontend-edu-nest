import { create } from 'zustand';
import {
  childrenApi,
  groupsApi,
  mealsApi,
  timetableApi,
  usersApi,
  type BellSchedule,
  type Child,
  type CreateChildDto,
  type CreateGroupDto,
  type Group,
  type MealPriceCategory,
  type UpdateChildDto,
  type UpdateGroupDto,
} from '../../../shared/api';
import type { User } from '../../../entities/user';

interface StructureState {
  groups: Group[];
  children: Child[];
  users: User[];
  bellSchedules: BellSchedule[];
  mealCategories: MealPriceCategory[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createGroupModal: { isOpen: boolean; institutionId: string | null };
  editGroupModal: { isOpen: boolean; group: Group | null };
  createChildModal: { isOpen: boolean; groupId: string | null };
  editChildModal: { isOpen: boolean; child: Child | null };
  setCreateGroupModal: (value: Partial<{ isOpen: boolean; institutionId: string | null }>) => void;
  setEditGroupModal: (value: Partial<{ isOpen: boolean; group: Group | null }>) => void;
  setCreateChildModal: (value: Partial<{ isOpen: boolean; groupId: string | null }>) => void;
  setEditChildModal: (value: Partial<{ isOpen: boolean; child: Child | null }>) => void;
  fetchStructure: (withChildren: boolean) => Promise<void>;
  fetchLookups: () => Promise<void>;
  createGroup: (dto: CreateGroupDto) => Promise<void>;
  updateGroup: (id: string, dto: UpdateGroupDto) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  createChild: (dto: CreateChildDto) => Promise<void>;
  updateChild: (id: string, dto: UpdateChildDto) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
}

export const useStructureStore = create<StructureState>((set, get) => {
  let withChildren = false;

  const reload = () => get().fetchStructure(withChildren);

  return {
    groups: [],
    children: [],
    users: [],
    bellSchedules: [],
    mealCategories: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    createGroupModal: { isOpen: false, institutionId: null },
    editGroupModal: { isOpen: false, group: null },
    createChildModal: { isOpen: false, groupId: null },
    editChildModal: { isOpen: false, child: null },

    setCreateGroupModal: (value) =>
      set((state) => ({ createGroupModal: { ...state.createGroupModal, ...value } })),

    setEditGroupModal: (value) =>
      set((state) => ({ editGroupModal: { ...state.editGroupModal, ...value } })),

    setCreateChildModal: (value) =>
      set((state) => ({ createChildModal: { ...state.createChildModal, ...value } })),

    setEditChildModal: (value) =>
      set((state) => ({ editChildModal: { ...state.editChildModal, ...value } })),

    fetchStructure: async (loadChildren) => {
      withChildren = loadChildren;
      set({ isLoading: true });
      try {
        const [groupsRes, childrenRes] = await Promise.all([
          groupsApi.getList(),
          loadChildren ? childrenApi.getList() : Promise.resolve(null),
        ]);
        set({ groups: groupsRes.data, children: childrenRes?.data ?? [] });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchLookups: async () => {
      const [usersRes, bellRes, mealRes] = await Promise.allSettled([
        usersApi.getList(),
        timetableApi.getBellSchedules(),
        mealsApi.getPriceCategories(),
      ]);
      set({
        users: usersRes.status === 'fulfilled' ? usersRes.value.data : [],
        bellSchedules: bellRes.status === 'fulfilled' ? bellRes.value.data.filter((b) => b.active) : [],
        mealCategories: mealRes.status === 'fulfilled' ? mealRes.value.data : [],
      });
    },

    createGroup: async (dto) => {
      set({ isCreating: true });
      try {
        await groupsApi.create(dto);
        await reload().catch(() => undefined);
      } finally {
        set({ isCreating: false });
      }
    },

    updateGroup: async (id, dto) => {
      set({ isUpdating: true });
      try {
        await groupsApi.update(id, dto);
        await reload().catch(() => undefined);
      } finally {
        set({ isUpdating: false });
      }
    },

    deleteGroup: async (id) => {
      set({ isDeleting: true });
      try {
        await groupsApi.delete(id);
        await reload().catch(() => undefined);
      } finally {
        set({ isDeleting: false });
      }
    },

    createChild: async (dto) => {
      set({ isCreating: true });
      try {
        await childrenApi.create(dto);
        await reload().catch(() => undefined);
      } finally {
        set({ isCreating: false });
      }
    },

    updateChild: async (id, dto) => {
      set({ isUpdating: true });
      try {
        await childrenApi.update(id, dto);
        await reload().catch(() => undefined);
      } finally {
        set({ isUpdating: false });
      }
    },

    deleteChild: async (id) => {
      set({ isDeleting: true });
      try {
        await childrenApi.delete(id);
        await reload().catch(() => undefined);
      } finally {
        set({ isDeleting: false });
      }
    },
  };
});
