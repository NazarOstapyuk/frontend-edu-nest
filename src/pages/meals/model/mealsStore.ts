import { create } from 'zustand';
import {
  mealsApi,
  type ComplexPriceDto,
  type Dish,
  type DishDto,
  type MealComplex,
  type MealComplexDto,
  type MealCourse,
  type MealPriceCategory,
  type SortedNamedDto,
} from '../../../shared/api';

interface MealsState {
  courses: MealCourse[];
  dishes: Dish[];
  priceCategories: MealPriceCategory[];
  complexes: MealComplex[];
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
}

const replace = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

const bySort = <T extends { sortOrder: number; name: string }>(list: T[]) =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

export const useMealsStore = create<MealsState>((set) => {
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
    deadline: '10:00',
    loadFailed: false,
    isSaving: false,
    load: async () => {
      set({ loadFailed: false });
      try {
        const [courses, dishes, categories, complexes, settings] = await Promise.all([
          mealsApi.getCourses(),
          mealsApi.getDishes(),
          mealsApi.getPriceCategories(),
          mealsApi.getComplexes(),
          mealsApi.getSettings(),
        ]);
        set({
          courses: courses.data,
          dishes: dishes.data,
          priceCategories: categories.data,
          complexes: complexes.data,
          deadline: settings.data.mealOrderDeadline,
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
  };
});
