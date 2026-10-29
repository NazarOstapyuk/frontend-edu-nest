import { childrenApi, type Tariff } from '../../../shared/api';

export const fetchChildInstitutionId = async (childId: string) => {
  try {
    const { data } = await childrenApi.getList();
    return data.find((child) => child.id === childId)?.group?.institution.id ?? null;
  } catch {
    return null;
  }
};

export const tariffsForInstitution = (tariffs: Tariff[], institutionId: string | null) =>
  institutionId ? tariffs.filter((t) => t.institutionId === null || t.institutionId === institutionId) : tariffs;
