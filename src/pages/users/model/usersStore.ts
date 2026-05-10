import { create } from 'zustand';
import { usersApi, type CreateUserDto } from '../../../shared/api';
import type { User } from '../../../entities/user';

interface UsersState {
  users: User[];
  isLoading: boolean;
  isDeleting: boolean;
  createUserModal: { isOpen: boolean };
  setCreateUserModal: (value: Partial<{ isOpen: boolean }>) => void;
  fetchUsers: () => Promise<void>;
  createUser: (dto: CreateUserDto) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoading: false,
  isDeleting: false,
  createUserModal: { isOpen: false },
  setCreateUserModal: (value) => set((state) => ({ createUserModal: { ...state.createUserModal, ...value } })),

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
    const { data } = await usersApi.create(dto);
    set((state) => ({ users: [...state.users, data] }));
  },

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
