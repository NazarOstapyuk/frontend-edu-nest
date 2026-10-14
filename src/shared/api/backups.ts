import { axiosInstance } from './axiosInstance';
import type { PersonRef } from './finance';

export type BackupKind = 'scheduled' | 'manual' | 'pre_restore';
export type BackupRunStatus = 'running' | 'succeeded' | 'failed';

export const backupKindLabels: Record<BackupKind, string> = {
  scheduled: 'Щоденна',
  manual: 'Ручна',
  pre_restore: 'Перед відновленням',
};

export const backupRunStatusLabels: Record<BackupRunStatus, string> = {
  running: 'Виконується',
  succeeded: 'Успішно',
  failed: 'Помилка',
};

export interface BackupRun {
  id: string;
  kind: BackupKind;
  status: BackupRunStatus;
  fileName: string | null;
  sizeBytes: number | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  createdBy: PersonRef | null;
}

export interface BackupFile {
  name: string;
  kind: BackupKind;
  sizeBytes: number;
  takenAt: string;
}

export interface BackupStatus {
  configured: boolean;
  dir: string | null;
  running: boolean;
  lastSuccess: BackupRun | null;
  lastFailure: BackupRun | null;
  stale: boolean;
  files: BackupFile[];
}

export const backupErrorLabel = (error: string) =>
  (({
    'Timed out': 'Перевищено час очікування',
    'Empty dump': 'Порожня копія',
    Interrupted: 'Перервано (бекенд перезапустився)',
  }) as Record<string, string>)[error] ?? error;

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

export const formatTakenAt = (takenAt: string) =>
  `${takenAt.slice(8, 10)}.${takenAt.slice(5, 7)}.${takenAt.slice(0, 4)} ${takenAt.slice(11, 16)}`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });

export const backupsApi = {
  getStatus: () => axiosInstance.get<BackupStatus>('/backups'),
  getRuns: () => axiosInstance.get<BackupRun[]>('/backups/runs'),
  create: () => axiosInstance.post<BackupRun>('/backups'),
};
