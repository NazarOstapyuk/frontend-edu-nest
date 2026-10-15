import { create } from 'zustand';
import {
  auditApi,
  type AuditEvent,
  type AuditEventDetail,
  type AuditEventsQuery,
  type AuthEvent,
  type AuthEventsQuery,
  type Paged,
} from '../../../shared/api';

interface AuditState {
  eventsQuery: AuditEventsQuery;
  events: Paged<AuditEvent> | null;
  eventsFailed: boolean;
  loadEvents: () => Promise<void>;
  setEventsQuery: (partial: Partial<AuditEventsQuery>) => Promise<void>;
  authQuery: AuthEventsQuery;
  logins: Paged<AuthEvent> | null;
  loginsFailed: boolean;
  loadLogins: () => Promise<void>;
  setAuthQuery: (partial: Partial<AuthEventsQuery>) => Promise<void>;
  selectedId: string | null;
  detail: AuditEventDetail | null;
  detailFailed: boolean;
  openEvent: (id: string) => Promise<void>;
  closeEvent: () => void;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  eventsQuery: {},
  events: null,
  eventsFailed: false,
  loadEvents: async () => {
    const query = get().eventsQuery;
    set({ eventsFailed: false });
    try {
      const { data } = await auditApi.events(query);
      if (get().eventsQuery === query) set({ events: data });
    } catch (error) {
      if (get().eventsQuery === query) set({ eventsFailed: true });
      throw error;
    }
  },
  setEventsQuery: async (partial) => {
    set({ eventsQuery: { ...get().eventsQuery, page: 1, ...partial } });
    await get().loadEvents();
  },
  authQuery: {},
  logins: null,
  loginsFailed: false,
  loadLogins: async () => {
    const query = get().authQuery;
    set({ loginsFailed: false });
    try {
      const { data } = await auditApi.auth(query);
      if (get().authQuery === query) set({ logins: data });
    } catch (error) {
      if (get().authQuery === query) set({ loginsFailed: true });
      throw error;
    }
  },
  setAuthQuery: async (partial) => {
    set({ authQuery: { ...get().authQuery, page: 1, ...partial } });
    await get().loadLogins();
  },
  selectedId: null,
  detail: null,
  detailFailed: false,
  openEvent: async (id) => {
    set({ selectedId: id, detail: null, detailFailed: false });
    try {
      const { data } = await auditApi.event(id);
      if (get().selectedId === id) set({ detail: data });
    } catch (error) {
      if (get().selectedId === id) set({ detailFailed: true });
      throw error;
    }
  },
  closeEvent: () => set({ selectedId: null, detail: null, detailFailed: false }),
}));
