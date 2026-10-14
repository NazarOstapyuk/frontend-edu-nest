import { create } from 'zustand';
import { backupErrorLabel, backupsApi, type BackupRun, type BackupStatus } from '../../../shared/api';
import { useNotifyStore } from '../../../shared/model/notifyStore';

interface BackupsState {
  status: BackupStatus | null;
  runs: BackupRun[];
  failed: boolean;
  isCreating: boolean;
  load: () => Promise<void>;
  create: () => Promise<void>;
}

export const useBackupsStore = create<BackupsState>((set, get) => ({
  status: null,
  runs: [],
  failed: false,
  isCreating: false,
  load: async () => {
    set({ failed: false });
    try {
      const [status, runs] = await Promise.all([backupsApi.getStatus(), backupsApi.getRuns()]);
      set({ status: status.data, runs: runs.data });
    } catch (error) {
      set({ failed: true });
      throw error;
    }
  },
  create: async () => {
    set({ isCreating: true });
    try {
      const { data } = await backupsApi.create();
      if (data.status === 'succeeded') useNotifyStore.getState().push('Копію створено', 'success');
      else useNotifyStore.getState().push(`Копію не створено: ${data.error ? backupErrorLabel(data.error) : 'помилка'}`);
      await get().load();
    } finally {
      set({ isCreating: false });
    }
  },
}));
