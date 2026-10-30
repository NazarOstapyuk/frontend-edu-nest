import type { Tariff } from '../../../shared/api';

export const tariffsForInstitution = (tariffs: Tariff[], institutionId: string | null) =>
  institutionId ? tariffs.filter((t) => t.institutionId === null || t.institutionId === institutionId) : tariffs;
