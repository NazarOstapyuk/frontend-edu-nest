import { axiosInstance } from './axiosInstance';

export interface RoutineGroup {
  id: string;
  name: string;
  institution: { id: string; name: string };
}

export interface RoutineItem {
  startTime: string;
  endTime: string;
  title: string;
}

export interface RoutineDay {
  date: string;
  working: boolean;
  calendarTitle: string | null;
  source: 'template' | 'override' | 'none';
  workingHours: string | null;
  note: string | null;
  items: RoutineItem[];
}

export interface RoutineView {
  group: { id: string; name: string } | null;
  days: RoutineDay[];
}

export interface RoutineTemplateItem extends RoutineItem {
  weekday: number;
}

export interface RoutineTemplate {
  id: string;
  validFrom: string;
  validTo: string | null;
  workingHours: string | null;
  note: string | null;
  items: RoutineTemplateItem[];
}

export interface RoutineTemplateDto {
  validFrom?: string;
  workingHours?: string;
  note?: string;
  items: RoutineTemplateItem[];
}

export interface RoutineDayDto {
  note?: string;
  items: RoutineItem[];
}

export const routineApi = {
  getRoutine: (groupId: string, from: string, to: string) =>
    axiosInstance.get<RoutineView>(`/groups/${groupId}/routine`, { params: { from, to } }),

  getTemplates: (groupId: string) =>
    axiosInstance.get<RoutineTemplate[]>(`/groups/${groupId}/routine/templates`),

  createTemplate: (groupId: string, dto: RoutineTemplateDto) =>
    axiosInstance.post<RoutineTemplate>(`/groups/${groupId}/routine/templates`, dto),

  updateTemplate: (id: string, dto: RoutineTemplateDto) =>
    axiosInstance.put<RoutineTemplate>(`/routine-templates/${id}`, dto),

  deleteTemplate: (id: string) =>
    axiosInstance.delete<{ message: string }>(`/routine-templates/${id}`),

  saveDay: (groupId: string, date: string, dto: RoutineDayDto) =>
    axiosInstance.put<RoutineDay>(`/groups/${groupId}/routine/days/${date}`, dto),

  resetDay: (groupId: string, date: string) =>
    axiosInstance.delete<RoutineDay>(`/groups/${groupId}/routine/days/${date}`),

  copy: (groupId: string, sourceGroupId: string, validFrom: string) =>
    axiosInstance.post<RoutineTemplate>(`/groups/${groupId}/routine/copy`, { sourceGroupId, validFrom }),

  getGroups: () =>
    axiosInstance.get<RoutineGroup[]>('/routine/groups'),

  getChildRoutine: (childId: string, from: string, to: string) =>
    axiosInstance.get<RoutineView>(`/me/children/${childId}/routine`, { params: { from, to } }),
};

const kyivParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Kyiv',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const kyivNow = () => {
  const parts = Object.fromEntries(kyivParts.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};
