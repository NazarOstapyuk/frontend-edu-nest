import { axiosInstance } from './axiosInstance';

export type WeekParity = 'every' | 'odd' | 'even';
export const weekParityLabels: Record<WeekParity, string> = {
  every: 'Щотижня',
  odd: 'Непарні тижні',
  even: 'Парні тижні',
};
export const weekParities = Object.keys(weekParityLabels) as WeekParity[];

export type LessonChangeType = 'cancel' | 'replace' | 'extra';

export type LessonStatus = 'present' | 'late' | 'absent';
export const lessonStatusLabels: Record<LessonStatus, string> = {
  present: 'Присутній',
  late: 'Запізнився',
  absent: 'Відсутній',
};
export const lessonStatuses = Object.keys(lessonStatusLabels) as LessonStatus[];

export type NushLevel = 'needs_support' | 'progressing' | 'with_help' | 'independent';
export const nushLevelLabels: Record<NushLevel, string> = {
  needs_support: 'Потребує значної підтримки',
  progressing: 'Демонструє помітний прогрес',
  with_help: 'Досягає результату з допомогою вчителя',
  independent: 'Демонструє результат самостійно',
};
export const nushLevels = Object.keys(nushLevelLabels) as NushLevel[];

export const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export interface NamedItem {
  id: string;
  name: string;
  active: boolean;
}

export interface BellPeriod {
  number: number;
  startTime: string;
  endTime: string;
}

export interface BellSchedule {
  id: string;
  name: string;
  active: boolean;
  periods: BellPeriod[];
}

export interface BellScheduleDto {
  name?: string;
  active?: boolean;
  periods?: BellPeriod[];
}

export interface Subgroup {
  id: string;
  groupId: string;
  name: string;
  active: boolean;
  children: { id: string; firstName: string; lastName: string }[];
}

export interface SubgroupDto {
  name?: string;
  active?: boolean;
  childIds?: string[];
}

export interface TimetableEntry {
  weekday: number;
  period: number;
  parity: WeekParity;
  subjectId: string;
  teacherId: string;
  roomId: string | null;
  subgroupId: string | null;
}

export interface TimetableVersion {
  id: string;
  groupId: string;
  validFrom: string;
  validTo: string | null;
  entries: TimetableEntry[];
}

export interface ScheduleSlot {
  period: number;
  startTime: string;
  endTime: string;
  subgroupId: string | null;
  subjectId: string;
  teacherId: string;
  roomId: string | null;
  source: 'timetable' | 'replace' | 'extra';
  cancelled: boolean;
  changeId: string | null;
  subjectName: string | null;
  teacherName: string | null;
  roomName: string | null;
  subgroupName: string | null;
  lessonId?: string | null;
}

export interface ClassSchedule {
  group: { id: string; name: string };
  periods: BellPeriod[];
  days: { date: string; working: boolean; title: string | null; slots: ScheduleSlot[] }[];
}

export interface ScheduleConflict {
  kind: 'teacher' | 'room' | 'class' | 'subgroup';
  weekday: number | null;
  date: string | null;
  period: number;
  groupName: string;
  subjectName: string | null;
  other: { groupName: string; period: number; subjectName: string | null };
}

export interface LessonChangeDto {
  date: string;
  period: number;
  subgroupId?: string;
  type: LessonChangeType;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  reason: string;
}

export interface MyLesson extends ScheduleSlot {
  group: { id: string; name: string };
}

export interface MyLessons {
  date: string;
  lessons: MyLesson[];
}

export interface LessonPupil {
  child: { id: string; firstName: string; lastName: string; middleName: string | null };
  state: { status: LessonStatus | null; reasonId: string | null; source: 'mark' | 'register' | 'none' };
  mark: { id: string; status: LessonStatus; reasonId: string | null; level: NushLevel | null; comment: string | null } | null;
  dayState: string | null;
  dayReasonId: string | null;
}

export interface LessonView {
  group: { id: string; name: string };
  date: string;
  slot: ScheduleSlot;
  lesson: { id: string; topic: string | null; homework: string | null } | null;
  canEdit: boolean;
  needsReason: boolean;
  pupils: LessonPupil[];
}

export interface LessonMarkDto {
  childId: string;
  status: LessonStatus;
  reasonId?: string;
  level?: NushLevel;
  comment?: string;
}

export interface SaveLessonDto {
  topic?: string;
  homework?: string;
  reason?: string;
  marks: LessonMarkDto[];
}

export interface ParentScheduleSlot {
  period: number;
  startTime: string;
  endTime: string;
  subjectName: string | null;
  teacherName: string | null;
  roomName: string | null;
  subgroupName: string | null;
  cancelled: boolean;
  replaced: boolean;
  extra: boolean;
  topic: string | null;
  homework: string | null;
}

export interface ParentSchedule {
  days: { date: string; working: boolean; title: string | null; slots: ParentScheduleSlot[] }[];
}

export interface ParentLessonRow {
  date: string;
  period: number;
  subjectName: string | null;
  status: LessonStatus;
  reasonName: string | null;
  level: NushLevel | null;
  comment: string | null;
  source: 'mark' | 'register' | 'none';
}

export interface ParentLessons {
  month: string;
  lessons: ParentLessonRow[];
  summary: {
    missed: number;
    missedExcused: number;
    bySubject: { subjectName: string; levels: Record<NushLevel, number> }[];
  };
}

export const addDaysIso = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const weekStart = (iso: string) => {
  const weekday = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDaysIso(iso, -weekday);
};

const conflictKindLabels: Record<ScheduleConflict['kind'], string> = {
  teacher: 'вчитель зайнятий',
  room: 'кабінет зайнятий',
  class: 'клас уже має урок',
  subgroup: 'підгрупи мають спільних дітей',
};

export const conflictText = (c: ScheduleConflict) =>
  `${c.groupName}, ${c.weekday ? weekdayLabels[c.weekday - 1] : c.date}, ${c.period}-й урок (${c.subjectName ?? '—'}): ${conflictKindLabels[c.kind]} — ${c.other.groupName}, ${c.other.period}-й урок (${c.other.subjectName ?? '—'})`;

const lessonPath = (groupId: string, date: string, period: number) => `/groups/${groupId}/lessons/${date}/${period}`;

export const timetableApi = {
  getSubjects: () => axiosInstance.get<NamedItem[]>('/subjects'),
  createSubject: (name: string) => axiosInstance.post<NamedItem>('/subjects', { name }),
  updateSubject: (id: string, dto: Partial<Pick<NamedItem, 'name' | 'active'>>) => axiosInstance.patch<NamedItem>(`/subjects/${id}`, dto),
  getRooms: () => axiosInstance.get<NamedItem[]>('/rooms'),
  createRoom: (name: string) => axiosInstance.post<NamedItem>('/rooms', { name }),
  updateRoom: (id: string, dto: Partial<Pick<NamedItem, 'name' | 'active'>>) => axiosInstance.patch<NamedItem>(`/rooms/${id}`, dto),
  getBellSchedules: () => axiosInstance.get<BellSchedule[]>('/bell-schedules'),
  createBellSchedule: (dto: Required<Pick<BellScheduleDto, 'name' | 'periods'>>) => axiosInstance.post<BellSchedule>('/bell-schedules', dto),
  updateBellSchedule: (id: string, dto: BellScheduleDto) => axiosInstance.patch<BellSchedule>(`/bell-schedules/${id}`, dto),
  getSubgroups: (groupId: string) => axiosInstance.get<Subgroup[]>(`/groups/${groupId}/subgroups`),
  createSubgroup: (groupId: string, dto: Required<Pick<SubgroupDto, 'name' | 'childIds'>>) => axiosInstance.post<Subgroup>(`/groups/${groupId}/subgroups`, dto),
  updateSubgroup: (id: string, dto: SubgroupDto) => axiosInstance.patch<Subgroup>(`/subgroups/${id}`, dto),
  getTimetables: (groupId: string) => axiosInstance.get<TimetableVersion[]>(`/groups/${groupId}/timetables`),
  createTimetable: (groupId: string, validFrom: string, entries: TimetableEntry[]) =>
    axiosInstance.post<TimetableVersion>(`/groups/${groupId}/timetables`, { validFrom, entries: entries.map(toEntryDto) }),
  replaceEntries: (id: string, entries: TimetableEntry[]) =>
    axiosInstance.put<TimetableVersion>(`/timetables/${id}/entries`, { entries: entries.map(toEntryDto) }),
  getSchedule: (groupId: string, from: string, to: string) =>
    axiosInstance.get<ClassSchedule>(`/groups/${groupId}/schedule`, { params: { from, to } }),
  createChange: (groupId: string, dto: LessonChangeDto) => axiosInstance.post(`/groups/${groupId}/lesson-changes`, dto),
  voidChange: (id: string, reason: string) => axiosInstance.post(`/lesson-changes/${id}/void`, { reason }),
  getMyLessons: (date: string) => axiosInstance.get<MyLessons>('/me/lessons', { params: { date } }),
  getLesson: (groupId: string, date: string, period: number, subgroupId?: string) =>
    axiosInstance.get<LessonView>(lessonPath(groupId, date, period), { params: { subgroupId } }),
  saveLesson: (groupId: string, date: string, period: number, subgroupId: string | undefined, dto: SaveLessonDto) =>
    axiosInstance.put<LessonView>(lessonPath(groupId, date, period), dto, { params: { subgroupId } }),
};

function toEntryDto(e: TimetableEntry) {
  return {
    weekday: e.weekday,
    period: e.period,
    parity: e.parity,
    subjectId: e.subjectId,
    teacherId: e.teacherId,
    roomId: e.roomId ?? undefined,
    subgroupId: e.subgroupId ?? undefined,
  };
}
