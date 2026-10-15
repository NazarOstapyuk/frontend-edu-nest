import { create } from 'zustand';
import {
  reportDefinitions,
  reportsApi,
  type Report,
  type ReportKey,
  type ReportQuery,
} from '../../../shared/api';

const kyivDay = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(date);

const currentMonth = (): Pick<ReportQuery, 'from' | 'to'> => {
  const today = kyivDay(new Date());
  const [year, month] = today.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, '0');
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}` };
};

interface ReportsState {
  selected: ReportKey | null;
  query: ReportQuery;
  report: Report | null;
  loading: boolean;
  failed: boolean;
  downloading: boolean;
  select: (key: ReportKey) => void;
  setQuery: (partial: Partial<ReportQuery>) => void;
  load: () => Promise<void>;
  download: () => Promise<void>;
}

let requestId = 0;

export const useReportsStore = create<ReportsState>((set, get) => ({
  selected: null,
  query: currentMonth(),
  report: null,
  loading: false,
  failed: false,
  downloading: false,
  select: (key) => {
    requestId += 1;
    const definition = reportDefinitions.find((d) => d.key === key);
    const { query } = get();
    const next: ReportQuery = { from: query.from, to: query.to };
    if (definition?.filters.includes('kind')) next.kind = query.kind;
    if (definition?.filters.includes('group')) next.groupId = query.groupId;
    if (definition?.filters.includes('child')) next.childId = query.childId;
    if (definition?.filters.includes('teacher')) next.teacherId = query.teacherId;
    set({ selected: key, query: next, report: null, loading: false, failed: false });
  },
  setQuery: (partial) => set({ query: { ...get().query, ...partial } }),
  load: async () => {
    const { selected, query } = get();
    if (!selected) return;
    const definition = reportDefinitions.find((d) => d.key === selected);
    const params = definition?.period ? query : { ...query, from: undefined, to: undefined };
    requestId += 1;
    const current = requestId;
    set({ loading: true, failed: false });
    try {
      const report = await reportsApi.get(selected, params);
      if (current === requestId) set({ report, loading: false });
    } catch {
      if (current === requestId) set({ report: null, loading: false, failed: true });
    }
  },
  download: async () => {
    const { selected, query, report } = get();
    if (!selected) return;
    const definition = reportDefinitions.find((d) => d.key === selected);
    const params = definition?.period ? query : { ...query, from: undefined, to: undefined };
    set({ downloading: true });
    try {
      await reportsApi.download(selected, params, report?.fileName ?? selected);
    } catch {
      return;
    } finally {
      set({ downloading: false });
    }
  },
}));
