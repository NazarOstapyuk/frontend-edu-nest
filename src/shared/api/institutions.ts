import { axiosInstance } from './axiosInstance';

export type InstitutionType = 'kindergarten' | 'school_class';

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  isActive: boolean;
}

export interface CreateInstitutionDto {
  name: string;
  type: InstitutionType;
}

export interface UpdateInstitutionDto {
  name?: string;
  type?: InstitutionType;
  isActive?: boolean;
}

export const institutionTypeLabels: Record<InstitutionType, string> = {
  kindergarten: 'Садок',
  school_class: 'Школа',
};

export const institutionsApi = {
  getList: () => axiosInstance.get<Institution[]>('/institutions'),
  create: (dto: CreateInstitutionDto) => axiosInstance.post<Institution>('/institutions', dto),
  update: (id: string, dto: UpdateInstitutionDto) => axiosInstance.patch<Institution>(`/institutions/${id}`, dto),
  delete: (id: string) => axiosInstance.delete<{ message: string }>(`/institutions/${id}`),
};
