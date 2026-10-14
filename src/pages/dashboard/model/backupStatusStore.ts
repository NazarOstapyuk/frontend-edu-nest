import { create } from 'zustand';
import { backupsApi, type BackupStatus } from '../../../shared/api';

interface BackupStatusState {
  status: BackupStatus | null;
  load: () => Promise<void>;
}

export const useBackupStatusStore = create<BackupStatusState>((set) => ({
  status: null,
  load: async () => {
    const { data } = await backupsApi.getStatus();
    set({ status: data });
  },
}));
