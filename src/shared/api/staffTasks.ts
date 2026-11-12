import { axiosInstance } from './axiosInstance';

export type StaffTaskRole = 'admin' | 'teacher';

export type TaskPersonRole = StaffTaskRole | 'parent' | 'root';

export type MyTaskStatus = 'open' | 'overdue' | 'done' | 'cancelled';

export const myTaskStatusLabels: Record<MyTaskStatus, string> = {
  open: 'Відкрите',
  overdue: 'Прострочено',
  done: 'Виконано',
  cancelled: 'Скасовано',
};

export const staffTaskRoleLabels: Record<StaffTaskRole, string> = {
  admin: 'Адміністратор',
  teacher: 'Педагог',
};

export const isStaffTaskRole = (role: TaskPersonRole): role is StaffTaskRole =>
  role === 'admin' || role === 'teacher';

export const staffTaskRoleLabel = (role: TaskPersonRole) =>
  isStaffTaskRole(role) ? staffTaskRoleLabels[role] : 'не працівник';

export interface AssignableUser {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  role: StaffTaskRole;
}

export interface TaskAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface GivenTaskAssignee {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  role: TaskPersonRole;
  isActive: boolean;
  doneAt: string | null;
}

export interface GivenTask {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  dueDate: string;
  dueTime: string;
  cancelledAt: string | null;
  author: TaskAuthor;
  overdue: boolean;
  done: number;
  total: number;
  assignees: GivenTaskAssignee[];
}

export interface MyTask {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  dueDate: string;
  dueTime: string;
  author: TaskAuthor;
  status: MyTaskStatus;
  doneAt: string | null;
}

export interface TaskPage<T> {
  items: T[];
  nextBefore: string | null;
}

export interface TaskSummary {
  open: number;
  overdue: number;
}

export interface CreateStaffTaskDto {
  title: string;
  description?: string;
  dueDate: string;
  dueTime: string;
  assigneeIds: string[];
}

export interface UpdateStaffTaskDto {
  title?: string;
  description?: string | null;
  dueDate?: string;
  dueTime?: string;
  assigneeIds?: string[];
}

const kyivDateTime = new Intl.DateTimeFormat('uk-UA', {
  timeZone: 'Europe/Kyiv',
  year: 'numeric',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const kyivParts = (date: Date) =>
  Object.fromEntries(kyivDateTime.formatToParts(date).map((p) => [p.type, p.value]));

export const formatTaskMoment = (iso: string) => {
  const parts = kyivParts(new Date(iso));
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
};

export const isGivenTaskClosed = (task: GivenTask) =>
  task.cancelledAt !== null || (task.total > 0 && task.done === task.total);

export const isMyTaskClosed = (task: MyTask) => task.status === 'done' || task.status === 'cancelled';

const pageParams = (before?: string | null, all?: boolean) => ({
  ...(before ? { before } : {}),
  ...(all ? { all: 'true' } : {}),
});

export const staffTasksApi = {
  getAssignable: () => axiosInstance.get<AssignableUser[]>('/staff-tasks/assignable'),

  getGiven: (before?: string | null, all?: boolean) =>
    axiosInstance.get<TaskPage<GivenTask>>('/staff-tasks/given', { params: pageParams(before, all) }),

  getMine: (before?: string | null) =>
    axiosInstance.get<TaskPage<MyTask>>('/staff-tasks/mine', { params: pageParams(before) }),

  getSummary: () => axiosInstance.get<TaskSummary>('/staff-tasks/summary'),

  create: (dto: CreateStaffTaskDto) => axiosInstance.post<GivenTask>('/staff-tasks', dto),

  update: (id: string, dto: UpdateStaffTaskDto) => axiosInstance.patch<GivenTask>(`/staff-tasks/${id}`, dto),

  cancel: (id: string) => axiosInstance.post<GivenTask>(`/staff-tasks/${id}/cancel`),

  done: (id: string) => axiosInstance.post<MyTask>(`/staff-tasks/${id}/done`),

  undone: (id: string) => axiosInstance.post<MyTask>(`/staff-tasks/${id}/undone`),
};
