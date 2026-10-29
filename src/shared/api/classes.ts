import { axiosInstance } from './axiosInstance';
import type { PersonRef } from './finance';

export type MissedLessonRule = 'no_charge' | 'always' | 'unexcused_only';
export type ClassFormat = 'individual' | 'group';
export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused';
export type PackageState = 'active' | 'exhausted' | 'expired' | 'voided' | 'needs_reconciliation';
export type ReconcileOutcome = 'paid_full' | 'paid_partial' | 'not_paid';

export const missedRuleLabels: Record<MissedLessonRule, string> = {
  no_charge: 'Пропуски не списуються',
  always: 'Списувати завжди',
  unexcused_only: 'Списувати лише неповажні',
};

export const classFormatLabels: Record<ClassFormat, string> = {
  individual: 'Індивідуальне',
  group: 'Групове',
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  present: 'Присутній',
  absent_excused: 'Поважний пропуск',
  absent_unexcused: 'Неповажний пропуск',
};

export const packageStateLabels: Record<PackageState, string> = {
  active: 'Активний',
  exhausted: 'Вичерпаний',
  expired: 'Прострочений',
  voided: 'Сторнований',
  needs_reconciliation: 'Потребує звірки',
};

export const reconcileOutcomeLabels: Record<ReconcileOutcome, string> = {
  paid_full: 'Оплачено повністю',
  paid_partial: 'Оплачено частково',
  not_paid: 'Не оплачено',
};

export const missedRules = Object.keys(missedRuleLabels) as MissedLessonRule[];
export const classFormats = Object.keys(classFormatLabels) as ClassFormat[];
export const attendanceStatuses = Object.keys(attendanceStatusLabels) as AttendanceStatus[];

export interface TariffRef {
  id: string;
  name: string;
}

export interface ClassGroupSummary {
  id: string;
  name: string;
  format: ClassFormat;
  isActive: boolean;
  teachers: PersonRef[];
  singleTariff: TariffRef | null;
  packageTariff: TariffRef | null;
  activeMembers: number;
}

export interface Direction {
  id: string;
  name: string;
  missedRule: MissedLessonRule;
  isActive: boolean;
  groups: ClassGroupSummary[];
}

export interface ClassGroupMember {
  id: string;
  child: PersonRef;
  startDate: string;
  endDate: string | null;
}

export interface LessonSummary {
  id: string;
  date: string;
  conductedBy: PersonRef;
  attendances: { childId: string; childName: string; status: AttendanceStatus; isGuest: boolean }[];
}

export interface ClassGroupDetail extends ClassGroupSummary {
  direction: { id: string; name: string; missedRule: MissedLessonRule };
  members: ClassGroupMember[];
  lessons: LessonSummary[];
}

export interface MyClassGroup extends ClassGroupSummary {
  direction: { id: string; name: string };
}

export interface RosterRow {
  child: PersonRef;
  isMember: boolean;
  attendance: { id: string; status: AttendanceStatus; isGuest: boolean } | null;
  packageInfo: { packageId: string; remaining: number; total: number; expiresAt: string | null } | null;
}

export interface LessonRoster {
  group: { id: string; name: string; direction: { id: string; name: string; missedRule: MissedLessonRule } };
  date: string;
  lessonId: string | null;
  conductedBy: PersonRef | null;
  hasSingleTariff: boolean;
  rows: RosterRow[];
}

export interface ChildPackage {
  id: string;
  direction: { id: string; name: string };
  tariff: TariffRef | null;
  sessionsTotal: number;
  used: number;
  remaining: number;
  purchaseDate: string;
  expiresAt: string | null;
  state: PackageState;
  chargeId: string | null;
  needsReconciliation: boolean;
  reconciledAt: string | null;
  reconciliationNote: string | null;
  legacyTotalPrice: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  extensions: { id: string; previousExpiresAt: string | null; newExpiresAt: string; reason: string; createdAt: string }[];
  usages: { id: string; date: string; groupName: string; status: AttendanceStatus; voidedAt: string | null }[];
  legacyAttendances: { id: string; date: string; note: string | null }[];
}

export interface ReconciliationItem {
  id: string;
  child: PersonRef;
  directionName: string;
  sessionsTotal: number;
  remaining: number;
  totalPrice: string;
}

export interface DirectionDto {
  name: string;
  missedRule: MissedLessonRule;
  isActive?: boolean;
}

export interface ClassGroupDto {
  name: string;
  directionId: string;
  format: ClassFormat;
  teacherIds: string[];
  singleTariffId: string | null;
  packageTariffId: string | null;
  isActive?: boolean;
}

export interface MarkLessonDto {
  marks: { childId: string; status: AttendanceStatus; isGuest?: boolean }[];
  reason?: string;
}

export interface PurchasePackageDto {
  directionId: string;
  tariffId: string;
  purchaseDate: string;
}

export interface ReconcileDto {
  outcome: ReconcileOutcome;
  paidAmount?: string;
  note?: string;
}

export const directionsApi = {
  getList: () => axiosInstance.get<Direction[]>('/directions'),
  create: (dto: DirectionDto) => axiosInstance.post<Direction[]>('/directions', dto),
  update: (id: string, dto: Partial<DirectionDto>) => axiosInstance.patch<Direction[]>(`/directions/${id}`, dto),
  delete: (id: string) => axiosInstance.delete<Direction[]>(`/directions/${id}`),
};

export const classGroupsApi = {
  get: (id: string) => axiosInstance.get<ClassGroupDetail>(`/class-groups/${id}`),
  getMine: () => axiosInstance.get<MyClassGroup[]>('/my/class-groups'),
  create: (dto: ClassGroupDto) => axiosInstance.post<ClassGroupDetail>('/class-groups', dto),
  update: (id: string, dto: Partial<ClassGroupDto>) => axiosInstance.patch<ClassGroupDetail>(`/class-groups/${id}`, dto),
  delete: (id: string) => axiosInstance.delete(`/class-groups/${id}`),
  addMember: (id: string, dto: { childId: string; startDate: string }) =>
    axiosInstance.post<ClassGroupDetail>(`/class-groups/${id}/members`, dto),
  endMember: (memberId: string, endDate: string) =>
    axiosInstance.patch<ClassGroupDetail>(`/class-group-members/${memberId}/end`, { endDate }),
  getRoster: (id: string, date: string) => axiosInstance.get<LessonRoster>(`/class-groups/${id}/lessons/${date}`),
  mark: (id: string, date: string, dto: MarkLessonDto) =>
    axiosInstance.put<LessonRoster>(`/class-groups/${id}/lessons/${date}`, dto),
};

export const packagesApi = {
  getByChild: (childId: string) => axiosInstance.get<ChildPackage[]>(`/children/${childId}/packages`),
  purchase: (childId: string, dto: PurchasePackageDto) =>
    axiosInstance.post<ChildPackage[]>(`/children/${childId}/packages`, dto),
  extend: (id: string, dto: { newExpiresAt: string; reason: string }) =>
    axiosInstance.post<ChildPackage[]>(`/packages/${id}/extend`, dto),
  void: (id: string, reason: string) => axiosInstance.post<ChildPackage[]>(`/packages/${id}/void`, { reason }),
  reconcile: (id: string, dto: ReconcileDto) => axiosInstance.post<ChildPackage[]>(`/packages/${id}/reconcile`, dto),
  getReconciliation: () => axiosInstance.get<ReconciliationItem[]>('/packages/reconciliation'),
  migrateLegacy: () =>
    axiosInstance.post<{ directions: number; packages: number; skipped: number }>('/legacy/subscriptions/migrate'),
};

export const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const formatDay = (value: string) => new Date(value).toLocaleDateString('uk-UA', { timeZone: 'UTC' });
