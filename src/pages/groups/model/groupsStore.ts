import { create } from 'zustand';
import { groupsApi, type CreateGroupDto, type UpdateGroupDto, type Group } from '../../../shared/api';

interface GroupsState {
  groups: Group[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createGroupModal: { isOpen: boolean };
  editGroupModal: { isOpen: boolean; group: Group | null };
  setCreateGroupModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditGroupModal: (value: Partial<{ isOpen: boolean; group: Group | null }>) => void;
  fetchGroups: () => Promise<void>;
  createGroup: (dto: CreateGroupDto) => Promise<void>;
  updateGroup: (id: string, dto: UpdateGroupDto) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createGroupModal: { isOpen: false },
  editGroupModal: { isOpen: false, group: null },

  setCreateGroupModal: (value) =>
    set((state) => ({ createGroupModal: { ...state.createGroupModal, ...value } })),

  setEditGroupModal: (value) =>
    set((state) => ({ editGroupModal: { ...state.editGroupModal, ...value } })),

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await groupsApi.getList();
      set({ groups: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await groupsApi.create(dto);
      set((state) => ({ groups: [...state.groups, data] }));
    } finally {
      set({ isCreating: false });
    }
  },

  updateGroup: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await groupsApi.update(id, dto);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? data : g)),
      }));
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteGroup: async (id) => {
    set({ isDeleting: true });
    try {
      await groupsApi.delete(id);
      set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
