import type { User } from '../../entities/user';
import { axiosInstance } from './axiosInstance';
import type { GroupKind } from './register';

export interface Group {
  id: string;
  name: string;
  kind: GroupKind;
  teachers: User[];
  bellScheduleId: string | null;
  mealPriceCategoryId: string | null;
  createdAt: string;
}

export interface CreateGroupDto {
  name: string;
  kind: GroupKind;
  teacherIds: string[];
  bellScheduleId?: string | null;
  mealPriceCategoryId?: string | null;
}

export interface UpdateGroupDto {
  name: string;
  kind: GroupKind;
  teacherIds: string[];
  bellScheduleId?: string | null;
  mealPriceCategoryId?: string | null;
}

export const groupsApi = {
  getList: () =>
    axiosInstance.get<Group[]>('/groups'),

  create: (dto: CreateGroupDto) =>
    axiosInstance.post<Group>('/groups', dto),

  update: (id: string, dto: UpdateGroupDto) =>
    axiosInstance.patch<Group>(`/groups/${id}`, dto),

  delete: (id: string) =>
    axiosInstance.delete(`/groups/${id}`),
};
