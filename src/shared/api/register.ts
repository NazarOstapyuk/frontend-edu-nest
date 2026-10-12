import { axiosInstance } from './axiosInstance';

export type GroupKind = 'kindergarten' | 'school_class';
export const groupKindLabels: Record<GroupKind, string> = {
  kindergarten: 'Садок',
  school_class: 'Клас',
};
export const groupKinds = Object.keys(groupKindLabels) as GroupKind[];

export type DailyStatus = 'present' | 'late' | 'left_early' | 'absent';
export const dailyStatusLabels: Record<DailyStatus, string> = {
  present: 'Присутній',
  late: 'Запізнився',
  left_early: 'Пішов раніше',
  absent: 'Відсутній',
};
export const dailyStatuses = Object.keys(dailyStatusLabels) as DailyStatus[];

export type DayState = 'present' | 'absent' | 'expected_absent' | 'unmarked' | 'non_working';
export const dayStateLabels: Record<DayState, string> = {
  present: 'Присутній',
  absent: 'Відсутній',
  expected_absent: 'Очікується відсутність',
  unmarked: 'Не відмічено',
  non_working: 'Неробочий день',
};

export type CalendarDayType = 'non_working' | 'working';
export const calendarDayTypeLabels: Record<CalendarDayType, string> = {
  non_working: 'Неробочий',
  working: 'Робочий',
};

export type CalendarScope = 'all' | 'kindergarten' | 'school_class' | 'group';
export const calendarScopeLabels: Record<CalendarScope, string> = {
  all: 'Усі',
  kindergarten: 'Садок',
  school_class: 'Школа',
  group: 'Одна група',
};

export type NoticeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export const noticeStatusLabels: Record<NoticeStatus, string> = {
  pending: 'Очікує',
  approved: 'Підтверджено',
  rejected: 'Відхилено',
  cancelled: 'Скасовано',
};

export interface AbsenceReason {
  id: string;
  name: string;
  excused: boolean;
  requiresDocument: boolean;
  active: boolean;
  sortOrder: number;
}

export interface AbsenceReasonDto {
  name: string;
  excused: boolean;
  requiresDocument: boolean;
  sortOrder: number;
}

export interface UpdateAbsenceReasonDto extends Partial<AbsenceReasonDto> {
  active?: boolean;
}

export interface CalendarEntry {
  id: string;
  startDate: string;
  endDate: string;
  type: CalendarDayType;
  scope: CalendarScope;
  groupId: string | null;
  group: { id: string; name: string } | null;
  title: string;
  createdAt: string;
}

export interface CreateCalendarDayDto {
  startDate: string;
  endDate?: string;
  type: CalendarDayType;
  scope: CalendarScope;
  groupId?: string;
  title: string;
}

export interface RegisterGroup {
  id: string;
  name: string;
  kind: GroupKind;
}

interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
}

interface ChildRef extends PersonRef {
  middleName: string | null;
}

export interface RegisterRow {
  child: ChildRef;
  state: DayState;
  mark: {
    id: string;
    status: DailyStatus;
    reasonId: string | null;
    note: string | null;
    documentProvided: boolean;
    markedBy: PersonRef;
    createdAt: string;
  } | null;
  notice: { id: string; startDate: string; endDate: string; reasonId: string; comment: string | null } | null;
  documentRequired: boolean;
}

export interface RegisterDay {
  date: string;
  working: boolean;
  calendarTitle: string | null;
  canEdit: boolean;
  needsReason: boolean;
  children: RegisterRow[];
}

export interface RegisterMarkDto {
  childId: string;
  status: DailyStatus;
  reasonId?: string;
  note?: string;
  documentProvided?: boolean;
}

export interface SaveRegisterDto {
  date: string;
  reason?: string;
  marks: RegisterMarkDto[];
}

export interface DaySummary {
  workingDays: number;
  present: number;
  absentExcused: number;
  absentUnexcused: number;
  expectedAbsent: number;
  unmarked: number;
}

export interface MonthCell {
  date: string;
  state: DayState;
  status: DailyStatus | null;
  reasonId: string | null;
}

export interface RegisterMonth {
  month: string;
  days: { date: string; working: boolean; title: string | null }[];
  children: { child: ChildRef; days: MonthCell[]; summary: DaySummary }[];
}

export interface ParentNotice {
  id: string;
  startDate: string;
  endDate: string;
  comment: string | null;
  status: NoticeStatus;
  decisionReason: string | null;
  createdAt: string;
  reason: { id: string; name: string };
}

export interface AdminNotice extends ParentNotice {
  decidedAt: string | null;
  child: ChildRef & { group: { id: string; name: string } | null };
  createdBy: PersonRef;
  decidedBy: PersonRef | null;
}

export interface CreateNoticeDto {
  startDate: string;
  endDate: string;
  reasonId: string;
  comment?: string;
}

export interface ChildRegisterMonth {
  month: string;
  days: { date: string; state: DayState; status: DailyStatus | null; reasonName: string | null; title: string | null }[];
  summary: DaySummary;
}

export const shiftMonth = (month: string, delta: number) => {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const registerApi = {
  getReasons: () => axiosInstance.get<AbsenceReason[]>('/absence-reasons'),
  createReason: (dto: AbsenceReasonDto) => axiosInstance.post<AbsenceReason>('/absence-reasons', dto),
  updateReason: (id: string, dto: UpdateAbsenceReasonDto) =>
    axiosInstance.patch<AbsenceReason>(`/absence-reasons/${id}`, dto),
  getCalendar: (from: string, to: string, groupId?: string) =>
    axiosInstance.get<CalendarEntry[]>('/calendar', { params: { from, to, groupId } }),
  createCalendarDay: (dto: CreateCalendarDayDto) => axiosInstance.post<CalendarEntry>('/calendar', dto),
  voidCalendarDay: (id: string, reason: string) =>
    axiosInstance.post<CalendarEntry>(`/calendar/${id}/void`, { reason }),
  getGroups: () => axiosInstance.get<RegisterGroup[]>('/register/groups'),
  getSettings: () => axiosInstance.get<{ editDays: number }>('/register/settings'),
  updateSettings: (editDays: number) =>
    axiosInstance.patch<{ editDays: number }>('/register/settings', { editDays }),
  getDay: (groupId: string, date: string) =>
    axiosInstance.get<RegisterDay>(`/groups/${groupId}/register`, { params: { date } }),
  saveDay: (groupId: string, dto: SaveRegisterDto) =>
    axiosInstance.put<RegisterDay>(`/groups/${groupId}/register`, dto),
  getMonth: (groupId: string, month: string) =>
    axiosInstance.get<RegisterMonth>(`/groups/${groupId}/register/month`, { params: { month } }),
  getNotices: (status?: NoticeStatus) =>
    axiosInstance.get<AdminNotice[]>('/absence-notices', { params: { status } }),
  approveNotice: (id: string) => axiosInstance.post<AdminNotice>(`/absence-notices/${id}/approve`),
  rejectNotice: (id: string, reason: string) =>
    axiosInstance.post<AdminNotice>(`/absence-notices/${id}/reject`, { reason }),
  cancelNotice: (id: string, reason: string) =>
    axiosInstance.post<AdminNotice>(`/absence-notices/${id}/cancel`, { reason }),
};
