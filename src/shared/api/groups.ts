import type { User } from '../../entities/user';
import { axiosInstance } from './axiosInstance';

export interface Group {
  id: string;
  name: string;
  teachers: User[];
  createdAt: string;
}

export interface CreateGroupDto {
  name: string;
  teacherIds: string[];
}

export interface UpdateGroupDto {
  name: string;
  teacherIds: string[];
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
