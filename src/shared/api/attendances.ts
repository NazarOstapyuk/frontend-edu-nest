import { axiosInstance } from './axiosInstance';

export interface Attendance {
  id: string;
  subscriptionId: string;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface CreateAttendanceDto {
  date?: string;
  note?: string;
}

export const attendancesApi = {
  getList: (subscriptionId: string) =>
    axiosInstance.get<Attendance[]>(`/subscriptions/${subscriptionId}/attendances`),

  create: (subscriptionId: string, dto: CreateAttendanceDto) =>
    axiosInstance.post<Attendance>(`/subscriptions/${subscriptionId}/attendances`, dto),

  delete: (subscriptionId: string, attendanceId: string) =>
    axiosInstance.delete(`/subscriptions/${subscriptionId}/attendances/${attendanceId}`),
};
