import { axiosInstance } from './axiosInstance';
import type { FinanceCategory } from './finance';

export type TariffUnit = 'month' | 'hour' | 'session' | 'package';
export type BillingMode = 'anniversary' | 'calendar_prorated' | 'calendar_full';

export const tariffUnitLabels: Record<TariffUnit, string> = {
  month: 'Місяць',
  hour: 'Година',
  session: 'Заняття',
  package: 'Пакет занять',
};

export const billingModeLabels: Record<BillingMode, string> = {
  anniversary: 'Від дати старту',
  calendar_prorated: 'Календарний, перший місяць пропорційно',
  calendar_full: 'Календарний, перший місяць повністю',
};

export const tariffUnits = Object.keys(tariffUnitLabels) as TariffUnit[];
export const billingModes = Object.keys(billingModeLabels) as BillingMode[];

export interface TariffPrice {
  id: string;
  price: string;
  effectiveFrom: string;
}

export interface Tariff {
  id: string;
  name: string;
  institutionId: string | null;
  category: FinanceCategory;
  unit: TariffUnit;
  packageSize: number | null;
  validityDays: number | null;
  billingMode: BillingMode;
  isActive: boolean;
  currentPrice: string | null;
  prices: TariffPrice[];
}

export interface CreateTariffDto {
  name: string;
  institutionId: string | null;
  category: FinanceCategory;
  unit: TariffUnit;
  packageSize?: number;
  validityDays?: number;
  billingMode: BillingMode;
  price: string;
  effectiveFrom: string;
}

export interface UpdateTariffDto {
  name?: string;
  institutionId?: string | null;
  validityDays?: number | null;
  billingMode?: BillingMode;
  isActive?: boolean;
}

export interface AddTariffPriceDto {
  price: string;
  effectiveFrom: string;
}

export const tariffsApi = {
  getList: () => axiosInstance.get<Tariff[]>('/tariffs'),

  create: (dto: CreateTariffDto) => axiosInstance.post<Tariff>('/tariffs', dto),

  update: (id: string, dto: UpdateTariffDto) => axiosInstance.patch<Tariff>(`/tariffs/${id}`, dto),

  addPrice: (id: string, dto: AddTariffPriceDto) =>
    axiosInstance.post<Tariff>(`/tariffs/${id}/prices`, dto),

  delete: (id: string) => axiosInstance.delete(`/tariffs/${id}`),
};
