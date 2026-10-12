import { create } from 'zustand';
import {
  registerApi,
  type CalendarEntry,
  type CreateCalendarDayDto,
  type RegisterGroup,
} from '../../../shared/api';

interface CalendarState {
  year: number;
  entries: CalendarEntry[];
  groups: RegisterGroup[];
  editDays: number | null;
  isLoading: boolean;
  isSaving: boolean;
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
  setYear: (year: number) => Promise<void>;
  loadMeta: () => Promise<void>;
  createEntry: (dto: CreateCalendarDayDto) => Promise<void>;
  voidEntry: (id: string, reason: string) => Promise<void>;
  saveEditDays: (editDays: number) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  year: new Date().getFullYear(),
  entries: [],
  groups: [],
  editDays: null,
  isLoading: false,
  isSaving: false,
  isModalOpen: false,
  setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  setYear: async (year) => {
    set({ year, isLoading: true });
    try {
      const { data } = await registerApi.getCalendar(`${year}-01-01`, `${year}-12-31`);
      if (get().year === year) set({ entries: data });
    } finally {
      if (get().year === year) set({ isLoading: false });
    }
  },
  loadMeta: async () => {
    const [{ data: groups }, { data: settings }] = await Promise.all([
      registerApi.getGroups(),
      registerApi.getSettings(),
    ]);
    set({ groups, editDays: settings.editDays });
  },
  createEntry: async (dto) => {
    set({ isSaving: true });
    try {
      const { data } = await registerApi.createCalendarDay(dto);
      set((state) => ({
        entries: [...state.entries, data].sort((a, b) => a.startDate.localeCompare(b.startDate)),
      }));
    } finally {
      set({ isSaving: false });
    }
  },
  voidEntry: async (id, reason) => {
    set({ isSaving: true });
    try {
      await registerApi.voidCalendarDay(id, reason);
      set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
    } finally {
      set({ isSaving: false });
    }
  },
  saveEditDays: async (editDays) => {
    set({ isSaving: true });
    try {
      const { data } = await registerApi.updateSettings(editDays);
      set({ editDays: data.editDays });
    } finally {
      set({ isSaving: false });
    }
  },
}));
