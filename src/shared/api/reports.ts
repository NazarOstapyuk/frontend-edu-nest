import { axiosInstance } from './axiosInstance';
import type { PermissionArea } from './access';

export type ReportKey =
  | 'payments'
  | 'charges'
  | 'debts'
  | 'attendance'
  | 'lessons'
  | 'meals'
  | 'payroll';
export type ColumnType = 'text' | 'money' | 'number' | 'date' | 'percent';
export interface ReportColumn {
  key: string;
  label: string;
  type: ColumnType;
}
export type Cell = string | number | null;
export type ReportRow = Record<string, Cell>;
export interface ReportSheet {
  name: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: ReportRow | null;
}
export interface Report {
  title: string;
  fileName: string;
  period: { from: string; to: string } | null;
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: ReportRow | null;
  sheets: ReportSheet[];
}
export interface ReportQuery {
  from?: string;
  to?: string;
  kind?: 'kindergarten' | 'school_class';
  groupId?: string;
  childId?: string;
  teacherId?: string;
  institutionId?: string;
}

export type ReportFilter = 'institution' | 'kind' | 'group' | 'child' | 'teacher';

export interface ReportDefinition {
  key: ReportKey;
  label: string;
  fileName: string;
  areas: PermissionArea[];
  period: boolean;
  filters: ReportFilter[];
}

export const reportDefinitions: ReportDefinition[] = [
  { key: 'payments', fileName: 'оплати', label: 'Оплати', areas: ['finance'], period: true, filters: ['institution', 'kind', 'group', 'child'] },
  { key: 'charges', fileName: 'нарахування', label: 'Нарахування', areas: ['finance'], period: true, filters: ['institution', 'kind', 'group', 'child'] },
  { key: 'debts', fileName: 'борги', label: 'Борги', areas: ['finance'], period: false, filters: ['institution', 'kind', 'group', 'child'] },
  { key: 'attendance', fileName: 'відвідування', label: 'Відвідування', areas: ['register'], period: true, filters: ['institution', 'kind', 'group', 'child'] },
  { key: 'lessons', fileName: 'уроки', label: 'Уроки', areas: ['timetable', 'classes'], period: true, filters: ['institution', 'kind', 'group', 'teacher'] },
  { key: 'meals', fileName: 'харчування', label: 'Харчування', areas: ['meals'], period: true, filters: ['institution', 'kind', 'group'] },
  { key: 'payroll', fileName: 'зарплати', label: 'Зарплати', areas: ['payroll'], period: true, filters: ['teacher'] },
];

const isoDay = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}.${month}.${year}`;
};

export const formatCell = (type: ColumnType, value: Cell): string => {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'money':
      return Number(value).toLocaleString('uk-UA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case 'date':
      return isoDay(String(value));
    case 'percent':
      return `${Math.round(Number(value) * 100)}%`;
    default:
      return String(value);
  }
};

const kyivToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());

export const reportsApi = {
  get: (key: ReportKey, query: ReportQuery) =>
    axiosInstance
      .get<Report>(`/reports/${key}`, { params: { ...query, format: 'json' } })
      .then((response) => response.data),
  download: async (key: ReportKey, query: ReportQuery, fileName: string) => {
    const { data } = await axiosInstance.get<Blob>(`/reports/${key}`, {
      params: { ...query, format: 'xlsx' },
      responseType: 'blob',
    });
    const suffix = query.from && query.to ? `${query.from}_${query.to}` : kyivToday();
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${suffix}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
