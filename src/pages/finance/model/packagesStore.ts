import { create } from 'zustand';
import {
  directionsApi,
  packagesApi,
  tariffsApi,
  type ChildPackage,
  type Direction,
  type PurchasePackageDto,
  type ReconcileDto,
  type Tariff,
} from '../../../shared/api';
import { useChildFinanceStore } from './childFinanceStore';

interface PackagesState {
  childId: string | null;
  packages: ChildPackage[];
  directions: Direction[];
  tariffs: Tariff[];
  isLoading: boolean;
  isSaving: boolean;
  buyOpen: boolean;
  extendTarget: ChildPackage | null;
  reconcileTarget: ChildPackage | null;
  voidTarget: ChildPackage | null;
  setBuyOpen: (open: boolean) => void;
  setExtendTarget: (pkg: ChildPackage | null) => void;
  setReconcileTarget: (pkg: ChildPackage | null) => void;
  setVoidTarget: (pkg: ChildPackage | null) => void;
  fetchPackages: (childId: string) => Promise<void>;
  purchase: (dto: PurchasePackageDto) => Promise<void>;
  extend: (id: string, newExpiresAt: string, reason: string) => Promise<void>;
  voidPackage: (reason: string) => Promise<void>;
  reconcile: (id: string, dto: ReconcileDto) => Promise<void>;
}

export const usePackagesStore = create<PackagesState>((set, get) => {
  const mutate = async (request: () => Promise<{ data: ChildPackage[] }>) => {
    const childId = get().childId;
    set({ isSaving: true });
    try {
      const { data } = await request();
      if (get().childId === childId) {
        set({ packages: data });
        if (childId) await useChildFinanceStore.getState().fetchFinance(childId).catch(() => undefined);
      }
    } finally {
      set({ isSaving: false });
    }
  };

  return {
    childId: null,
    packages: [],
    directions: [],
    tariffs: [],
    isLoading: false,
    isSaving: false,
    buyOpen: false,
    extendTarget: null,
    reconcileTarget: null,
    voidTarget: null,

    setBuyOpen: (open) => set({ buyOpen: open }),
    setExtendTarget: (pkg) => set({ extendTarget: pkg }),
    setReconcileTarget: (pkg) => set({ reconcileTarget: pkg }),
    setVoidTarget: (pkg) => set({ voidTarget: pkg }),

    fetchPackages: async (childId) => {
      set({ isLoading: true, childId, packages: [] });
      try {
        const [{ data: packages }, { data: directions }, { data: tariffs }] = await Promise.all([
          packagesApi.getByChild(childId),
          directionsApi.getList(),
          tariffsApi.getList(),
        ]);
        if (get().childId === childId) set({ packages, directions, tariffs });
      } finally {
        set({ isLoading: false });
      }
    },

    purchase: (dto) =>
      mutate(() => {
        const childId = get().childId;
        if (!childId) throw new Error('Child is not selected');
        return packagesApi.purchase(childId, dto);
      }),

    extend: (id, newExpiresAt, reason) => mutate(() => packagesApi.extend(id, { newExpiresAt, reason })),

    voidPackage: async (reason) => {
      const target = get().voidTarget;
      if (!target) return;
      await mutate(() => packagesApi.void(target.id, reason));
    },

    reconcile: (id, dto) => mutate(() => packagesApi.reconcile(id, dto)),
  };
});
