import { create } from 'zustand';
import { institutionsApi, type Institution } from '../api/institutions';

const STORAGE_KEY = 'edunest.institutionId';

interface InstitutionProfile {
  role: string;
  accessScope: string;
  institutionIds: string[];
}

interface InstitutionState {
  selectedId: string | null;
  institutions: Institution[];
  isLoading: boolean;
  load: () => Promise<void>;
  select: (id: string | null) => void;
  reconcile: (profile: InstitutionProfile) => void;
}

const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const writeStored = (id: string | null) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
};

const outsideProfile = (profile: InstitutionProfile, id: string) =>
  profile.role !== 'root' && profile.accessScope !== 'all' && !profile.institutionIds.includes(id);

export const useInstitutionStore = create<InstitutionState>((set, get) => ({
  selectedId: readStored(),
  institutions: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const { data } = await institutionsApi.getList();
      const { selectedId } = get();
      const dropped = selectedId !== null && !data.some((i) => i.id === selectedId);
      if (dropped) writeStored(null);
      set({ institutions: data, selectedId: dropped ? null : selectedId });
    } finally {
      set({ isLoading: false });
    }
  },

  select: (id) => {
    writeStored(id);
    set({ selectedId: id });
  },

  reconcile: (profile) => {
    if (profile.role === 'parent') {
      writeStored(null);
      set({ selectedId: null, institutions: [] });
      return;
    }
    const { selectedId } = get();
    if (selectedId !== null && outsideProfile(profile, selectedId)) {
      writeStored(null);
      set({ selectedId: null });
    }
    void get()
      .load()
      .catch(() => undefined);
  },
}));

export const getSelectedInstitutionId = () => useInstitutionStore.getState().selectedId;
