import { create } from 'zustand';
import { childrenApi, classGroupsApi, type Child, type ClassGroupDetail } from '../../../shared/api';

interface ClassGroupState {
  groupId: string | null;
  group: ClassGroupDetail | null;
  children: Child[];
  isLoading: boolean;
  isSaving: boolean;
  addMemberOpen: boolean;
  setAddMemberOpen: (open: boolean) => void;
  fetchGroup: (groupId: string, withChildren: boolean) => Promise<void>;
  addMember: (childId: string, startDate: string) => Promise<void>;
  endMember: (memberId: string, endDate: string) => Promise<void>;
}

export const useClassGroupStore = create<ClassGroupState>((set, get) => {
  const apply = async (groupId: string, request: () => Promise<{ data: ClassGroupDetail }>) => {
    set({ isSaving: true });
    try {
      const { data } = await request();
      if (get().groupId === groupId) set({ group: data });
    } finally {
      set({ isSaving: false });
    }
  };

  return {
    groupId: null,
    group: null,
    children: [],
    isLoading: false,
    isSaving: false,
    addMemberOpen: false,

    setAddMemberOpen: (open) => set({ addMemberOpen: open }),

    fetchGroup: async (groupId, withChildren) => {
      set({ isLoading: true, groupId, group: null });
      try {
        const [{ data: group }, children] = await Promise.all([
          classGroupsApi.get(groupId),
          withChildren ? childrenApi.getList().then((r) => r.data) : Promise.resolve([] as Child[]),
        ]);
        if (get().groupId === groupId) set({ group, children });
      } finally {
        set({ isLoading: false });
      }
    },

    addMember: async (childId, startDate) => {
      const { groupId } = get();
      if (!groupId) return;
      await apply(groupId, () => classGroupsApi.addMember(groupId, { childId, startDate }));
    },

    endMember: async (memberId, endDate) => {
      const { groupId } = get();
      if (!groupId) return;
      await apply(groupId, () => classGroupsApi.endMember(memberId, endDate));
    },
  };
});
