import { axiosInstance } from './axiosInstance';
import type { ChargeState } from './finance';

export interface AdaptationVisit {
  id: string;
  tariff: { id: string; name: string };
  date: string;
  hours: string;
  ratePerHour: string;
  amount: string;
  note: string | null;
  chargeId: string;
  chargeState: ChargeState | null;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface CreateAdaptationVisitDto {
  tariffId: string;
  date: string;
  hours: string;
  ratePerHour?: string;
  note?: string;
}

export const adaptationApi = {
  getByChild: (childId: string) =>
    axiosInstance.get<AdaptationVisit[]>(`/children/${childId}/adaptation-visits`),

  create: (childId: string, dto: CreateAdaptationVisitDto) =>
    axiosInstance.post<AdaptationVisit[]>(`/children/${childId}/adaptation-visits`, dto),

  void: (id: string, reason: string) =>
    axiosInstance.post<AdaptationVisit[]>(`/adaptation-visits/${id}/void`, { reason }),
};
