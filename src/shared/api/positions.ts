import type { PermissionItem } from './access';
import { axiosInstance } from './axiosInstance';

export interface Position {
  id: string;
  name: string;
  teaching: boolean;
  permissions: PermissionItem[];
  userCount: number;
}

export interface PositionDto {
  name: string;
  teaching: boolean;
  permissions: PermissionItem[];
}

export const positionsApi = {
  list: () => axiosInstance.get<Position[]>('/positions'),
  create: (dto: PositionDto) => axiosInstance.post<Position>('/positions', dto),
  update: (id: string, dto: Partial<PositionDto>) => axiosInstance.patch<Position>(`/positions/${id}`, dto),
  remove: (id: string) => axiosInstance.delete<{ message: string }>(`/positions/${id}`),
};
