import { create } from 'zustand';
import { usersApi, type AccessScope, type CreateUserDto, type UpdateUserDto } from '../../../shared/api';
import { sameScope } from './accessRules';
import type { User } from '../../../entities/user';

interface UsersState {
  users: User[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createUserModal: { isOpen: boolean };
  editUserModal: { isOpen: boolean; user: User | null };
  setCreateUserModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditUserModal: (value: Partial<{ isOpen: boolean; user: User | null }>) => void;
  fetchUsers: () => Promise<void>;
  createUser: (dto: CreateUserDto) => Promise<User>;
  updateUser: (id: string, dto: UpdateUserDto) => Promise<User>;
  applyScope: (user: User, accessScope: AccessScope, institutionIds: string[]) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  replaceUser: (user: User) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createUserModal: { isOpen: false },
  editUserModal: { isOpen: false, user: null },
  setCreateUserModal: (value) => set((state) => ({ createUserModal: { ...state.createUserModal, ...value } })),
  setEditUserModal: (value) => set((state) => ({ editUserModal: { ...state.editUserModal, ...value } })),

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const { data } = await usersApi.getList();
      set({ users: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createUser: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await usersApi.create(dto);
      set((state) => ({ users: [...state.users, data] }));
      return data;
    } finally {
      set({ isCreating: false });
    }
  },

  updateUser: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await usersApi.update(id, dto);
      set((state) => ({ users: state.users.map((u) => (u.id === id ? data : u)) }));
      return data;
    } finally {
      set({ isUpdating: false });
    }
  },

  applyScope: async (user, accessScope, institutionIds) => {
    if (sameScope(user, accessScope, institutionIds)) return;
    set({ isUpdating: true });
    try {
      const { data } = await usersApi.setAccess(user.id, {
        accessScope,
        ...(accessScope === 'institutions' ? { institutionIds } : {}),
        permissions: user.permissions ?? [],
      });
      set((state) => ({ users: state.users.map((u) => (u.id === data.id ? data : u)) }));
    } finally {
      set({ isUpdating: false });
    }
  },

  replaceUser: (user) =>
    set((state) => ({ users: state.users.map((u) => (u.id === user.id ? user : u)) })),

  deleteUser: async (id) => {
    set({ isDeleting: true });
    try {
      await usersApi.delete(id);
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
