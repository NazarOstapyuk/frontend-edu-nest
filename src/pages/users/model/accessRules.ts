import { ALL_AREAS, levelSatisfies, type AccessScope, type PermissionMap } from '../../../shared/api';
import type { SessionProfile, SessionRole, User } from '../../../entities/user';

export const permissionMap = (user: User): PermissionMap =>
  Object.fromEntries((user.permissions ?? []).map((p) => [p.area, p.level]));

export const scopeAllowed = (profile: SessionProfile | null, value: AccessScope) =>
  profile?.role === 'root' || profile?.accessScope === 'all' || value === 'institutions';

export const coversUser = (profile: SessionProfile | null, user: User) => {
  if (profile?.role === 'root') return true;
  const original = permissionMap(user);
  return (
    (profile?.accessScope === 'all' ||
      ((user.accessScope ?? 'all') === 'institutions' &&
        (user.institutionIds ?? []).every((id) => profile?.institutionIds.includes(id)))) &&
    ALL_AREAS.every((area) => {
      const have = original[area];
      return have === undefined || levelSatisfies(profile?.permissions?.[area], have);
    })
  );
};

export const canChangeAccess = (profile: SessionProfile | null, user: User) =>
  !!profile && profile.id !== user.id && (user.role as SessionRole) !== 'root' && coversUser(profile, user);

export const defaultScope = (profile: SessionProfile | null): { accessScope: AccessScope; institutionIds: string[] } =>
  profile && profile.role !== 'root' && profile.accessScope === 'institutions'
    ? { accessScope: 'institutions', institutionIds: [...profile.institutionIds] }
    : { accessScope: 'all', institutionIds: [] };

export const sameScope = (user: User, accessScope: AccessScope, institutionIds: string[]) => {
  const current = user.accessScope ?? 'all';
  if (current !== accessScope) return false;
  if (accessScope === 'all') return true;
  const have = new Set(user.institutionIds ?? []);
  return have.size === institutionIds.length && institutionIds.every((id) => have.has(id));
};
