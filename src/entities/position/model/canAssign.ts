import { levelSatisfies, type Position } from '../../../shared/api';
import type { SessionProfile } from '../../user';

export const canAssignPosition = (profile: SessionProfile | null, position: Position): boolean => {
  if (!profile) return false;
  if (profile.role === 'root') return true;
  return position.permissions.every((p) => levelSatisfies(profile.permissions?.[p.area], p.level));
};
