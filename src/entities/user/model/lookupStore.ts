import { create } from 'zustand';
import { usersApi, type UserLookup } from '../../../shared/api';

interface UserLookupState {
  teachers: UserLookup[];
  parents: UserLookup[];
  fetchTeachers: () => Promise<void>;
  fetchParents: () => Promise<void>;
}

export const useUserLookupStore = create<UserLookupState>((set) => ({
  teachers: [],
  parents: [],

  fetchTeachers: async () => {
    const { data } = await usersApi.lookup('teacher', true);
    set({ teachers: data });
  },

  fetchParents: async () => {
    const { data } = await usersApi.lookup('parent', true);
    set({ parents: data });
  },
}));
