import { create } from 'zustand';

export type NoticeSeverity = 'error' | 'success';

export interface Notice {
  id: number;
  message: string;
  severity: NoticeSeverity;
}

interface NotifyState {
  notices: Notice[];
  push: (message: string, severity?: NoticeSeverity) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useNotifyStore = create<NotifyState>((set) => ({
  notices: [],
  push: (message, severity = 'error') =>
    set((state) => ({ notices: [...state.notices, { id: nextId++, message, severity }] })),
  dismiss: (id) => set((state) => ({ notices: state.notices.filter((n) => n.id !== id) })),
}));
