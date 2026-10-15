import { create } from 'zustand';
import {
  addDaysIso,
  childrenApi,
  groupsApi,
  localToday,
  mealsApi,
  softList,
  weekStart,
  type AdminMealOrder,
  type Child,
  type ComplexPriceDto,
  type Dish,
  type DishDto,
  type FillResult,
  type Group,
  type GroupKind,
  type MealComplex,
  type MealComplexDto,
  type MealCourse,
  type MealPriceCategory,
  type MealSummary,
  type MenuDayView,
  type MenuTemplate,
  type OrderDay,
  type SortedNamedDto,
} from '../../../shared/api';

interface MealsState {
  courses: MealCourse[];
  dishes: Dish[];
  priceCategories: MealPriceCategory[];
  complexes: MealComplex[];
  groups: Group[];
  children: Child[];
  ordersDate: string;
  ordersKind: GroupKind | '';
  ordersGroupId: string;
  ordersKey: string | null;
  orders: AdminMealOrder[];
  summary: MealSummary | null;
  ordersFailed: boolean;
  loadOrders: (patch?: Partial<{ date: string; kind: GroupKind | ''; groupId: string }>) => Promise<void>;
  cancelOrder: (id: string, reason?: string) => Promise<void>;
  createOrders: (childId: string, days: OrderDay[]) => Promise<void>;
  deadline: string;
  loadFailed: boolean;
  isSaving: boolean;
  load: () => Promise<void>;
  saveCourse: (id: string | null, dto: SortedNamedDto) => Promise<void>;
  saveDish: (id: string | null, dto: DishDto) => Promise<void>;
  savePriceCategory: (id: string | null, dto: SortedNamedDto) => Promise<void>;
  saveComplex: (id: string | null, dto: MealComplexDto) => Promise<void>;
  addPrice: (complexId: string, dto: ComplexPriceDto) => Promise<void>;
  deletePrice: (complexId: string, priceId: string) => Promise<void>;
  saveDeadline: (value: string) => Promise<void>;
  menuKind: GroupKind;
  menuStart: string;
  menuWeeks: 1 | 4;
  menuKey: string | null;
  menuDays: MenuDayView[];
  menuFailed: boolean;
  templates: MenuTemplate[];
  templatesFailed: boolean;
  loadMenu: (patch?: Partial<{ kind: GroupKind; start: string; weeks: 1 | 4 }>) => Promise<void>;
  saveMenuDay: (date: string, dishIds: string[]) => Promise<void>;
  deleteMenuDay: (date: string) => Promise<void>;
  publishPeriod: () => Promise<void>;
  unpublishPeriod: () => Promise<void>;
  copyMenu: (dto: { fromStart: string; fromEnd: string; toStart: string; overwrite: boolean }) => Promise<FillResult>;
  loadTemplates: () => Promise<void>;
  saveTemplate: (id: string | null, dto: { name?: string; weeks?: number; active?: boolean }) => Promise<void>;
  saveTemplateItems: (id: string, items: { week: number; weekday: number; dishId: string }[]) => Promise<void>;
  applyTemplate: (id: string, dto: { from: string; to: string; startWeek: number; overwrite: boolean }) => Promise<FillResult>;
}

const replace = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

const bySort = <T extends { sortOrder: number; name: string }>(list: T[]) =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

export const useMealsStore = create<MealsState>((set, get) => {
  const saving = async (fn: () => Promise<void>) => {
    set({ isSaving: true });
    try {
      await fn();
    } finally {
      set({ isSaving: false });
    }
  };
  return {
    courses: [],
    dishes: [],
    priceCategories: [],
    complexes: [],
    groups: [],
    children: [],
    ordersDate: localToday(),
    ordersKind: '',
    ordersGroupId: '',
    ordersKey: null,
    orders: [],
    summary: null,
    ordersFailed: false,
    loadOrders: async (patch = {}) => {
      const state = get();
      const date = patch.date ?? state.ordersDate;
      const kind = patch.kind ?? state.ordersKind;
      const groupId = patch.groupId ?? state.ordersGroupId;
      const key = `${date}/${kind}/${groupId}`;
      set({ ordersDate: date, ordersKind: kind, ordersGroupId: groupId, ordersKey: key, orders: [], summary: null, ordersFailed: false });
      try {
        const { data } = await mealsApi.getOrders(date, kind || undefined, groupId || undefined);
        if (get().ordersKey === key) set({ orders: data.orders, summary: data.summary });
      } catch (error) {
        if (get().ordersKey === key) set({ ordersFailed: true });
        throw error;
      }
    },
    cancelOrder: (id, reason) =>
      saving(async () => {
        await mealsApi.cancelOrder(id, reason);
        await get().loadOrders();
      }),
    createOrders: (childId, days) =>
      saving(async () => {
        await mealsApi.createOrders(childId, days);
        await get().loadOrders();
      }),
    deadline: '10:00',
    loadFailed: false,
    isSaving: false,
    load: async () => {
      set({ loadFailed: false });
      try {
        const [courses, dishes, categories, complexes, settings, groups, children] = await Promise.all([
          mealsApi.getCourses(),
          mealsApi.getDishes(),
          mealsApi.getPriceCategories(),
          mealsApi.getComplexes(),
          mealsApi.getSettings(),
          softList(groupsApi.getList()),
          softList(childrenApi.getList()),
        ]);
        set({
          courses: courses.data,
          dishes: dishes.data,
          priceCategories: categories.data,
          complexes: complexes.data,
          deadline: settings.data.mealOrderDeadline,
          groups,
          children,
        });
      } catch (error) {
        set({ loadFailed: true });
        throw error;
      }
    },
    saveCourse: (id, dto) =>
      saving(async () => {
        const { data } = id ? await mealsApi.updateCourse(id, dto) : await mealsApi.createCourse(dto);
        set((s) => ({ courses: bySort(replace(s.courses, data)) }));
      }),
    saveDish: (id, dto) =>
      saving(async () => {
        const { data } = id ? await mealsApi.updateDish(id, dto) : await mealsApi.createDish(dto);
        set((s) => ({ dishes: replace(s.dishes, data) }));
      }),
    savePriceCategory: (id, dto) =>
      saving(async () => {
        const { data } = id ? await mealsApi.updatePriceCategory(id, dto) : await mealsApi.createPriceCategory(dto);
        set((s) => ({ priceCategories: bySort(replace(s.priceCategories, data)) }));
      }),
    saveComplex: (id, dto) =>
      saving(async () => {
        const { data } = id ? await mealsApi.updateComplex(id, dto) : await mealsApi.createComplex(dto);
        set((s) => ({ complexes: bySort(replace(s.complexes, data)) }));
      }),
    addPrice: (complexId, dto) =>
      saving(async () => {
        const { data } = await mealsApi.addPrice(complexId, dto);
        set((s) => ({ complexes: replace(s.complexes, data) }));
      }),
    deletePrice: (complexId, priceId) =>
      saving(async () => {
        const { data } = await mealsApi.deletePrice(complexId, priceId);
        set((s) => ({ complexes: replace(s.complexes, data) }));
      }),
    saveDeadline: (value) =>
      saving(async () => {
        const { data } = await mealsApi.updateSettings(value);
        set({ deadline: data.mealOrderDeadline });
      }),
    menuKind: 'kindergarten',
    menuStart: weekStart(localToday()),
    menuWeeks: 1,
    menuKey: null,
    menuDays: [],
    menuFailed: false,
    templates: [],
    templatesFailed: false,
    loadMenu: async (patch = {}) => {
      const state = get();
      const kind = patch.kind ?? state.menuKind;
      const start = patch.start ?? state.menuStart;
      const weeks = patch.weeks ?? state.menuWeeks;
      const key = `${kind}/${start}/${weeks}`;
      set({ menuKind: kind, menuStart: start, menuWeeks: weeks, menuKey: key, menuDays: [], menuFailed: false });
      try {
        const { data } = await mealsApi.getMenuDays(kind, start, addDaysIso(start, weeks * 7 - 1));
        if (get().menuKey === key) set({ menuDays: data });
      } catch (error) {
        if (get().menuKey === key) set({ menuFailed: true });
        throw error;
      }
    },
    saveMenuDay: (date, dishIds) =>
      saving(async () => {
        const { data } = await mealsApi.saveMenuDay(date, get().menuKind, dishIds);
        set((s) => ({ menuDays: s.menuDays.map((d) => (d.date === data.date ? data : d)) }));
      }),
    deleteMenuDay: (date) =>
      saving(async () => {
        await mealsApi.deleteMenuDay(date, get().menuKind);
        set((s) => ({ menuDays: s.menuDays.map((d) => (d.date === date ? { ...d, menu: null } : d)) }));
      }),
    publishPeriod: () =>
      saving(async () => {
        const { menuKind, menuStart, menuWeeks } = get();
        await mealsApi.publish(menuKind, menuStart, addDaysIso(menuStart, menuWeeks * 7 - 1));
        await get().loadMenu();
      }),
    unpublishPeriod: () =>
      saving(async () => {
        const { menuKind, menuStart, menuWeeks } = get();
        await mealsApi.unpublish(menuKind, menuStart, addDaysIso(menuStart, menuWeeks * 7 - 1));
        await get().loadMenu();
      }),
    copyMenu: async (dto) => {
      let result: FillResult = { created: 0, overwritten: 0, skipped: 0 };
      await saving(async () => {
        result = (await mealsApi.copy({ ...dto, kind: get().menuKind })).data;
        await get().loadMenu();
      });
      return result;
    },
    loadTemplates: async () => {
      set({ templatesFailed: false });
      try {
        const { data } = await mealsApi.getTemplates();
        set({ templates: data });
      } catch (error) {
        set({ templatesFailed: true });
        throw error;
      }
    },
    saveTemplate: (id, dto) =>
      saving(async () => {
        const { data } = id
          ? await mealsApi.updateTemplate(id, dto)
          : await mealsApi.createTemplate({ name: dto.name ?? '', weeks: dto.weeks ?? 1 });
        set((s) => ({ templates: replace(s.templates, data) }));
      }),
    saveTemplateItems: (id, items) =>
      saving(async () => {
        const { data } = await mealsApi.saveTemplateItems(id, items);
        set((s) => ({ templates: replace(s.templates, data) }));
      }),
    applyTemplate: async (id, dto) => {
      let result: FillResult = { created: 0, overwritten: 0, skipped: 0 };
      await saving(async () => {
        result = (await mealsApi.applyTemplate(id, { ...dto, kind: get().menuKind })).data;
        await get().loadMenu();
      });
      return result;
    },
  };
});
