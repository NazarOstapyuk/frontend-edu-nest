import { axiosInstance } from './axiosInstance';
import type { GroupKind } from './register';
import type { PersonRef } from './finance';

export type MenuStatus = 'draft' | 'published';
export const menuStatusLabels: Record<MenuStatus, string> = {
  draft: 'Чернетка',
  published: 'Опубліковано',
};
export const isoWeekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export interface MealCourse {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export type MealPriceCategory = MealCourse;

export interface SortedNamedDto {
  name?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface CourseRef {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Dish {
  id: string;
  name: string;
  courseId: string;
  description: string | null;
  active: boolean;
  course: CourseRef;
}

export interface DishDto {
  name?: string;
  courseId?: string;
  description?: string | null;
  active?: boolean;
}

export interface ComplexPrice {
  id: string;
  priceCategoryId: string;
  priceCategoryName: string;
  price: string;
  validFrom: string;
}

export interface MealComplex {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  courses: CourseRef[];
  prices: ComplexPrice[];
}

export interface MealComplexDto {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
  courseIds?: string[];
}

export interface ComplexPriceDto {
  priceCategoryId: string;
  price: string;
  validFrom: string;
}

export interface MenuDish {
  id: string;
  name: string;
  active: boolean;
  course: CourseRef;
}

export interface MenuDayView {
  date: string;
  working: boolean;
  title: string | null;
  menu: null | {
    id: string;
    status: MenuStatus;
    publishedAt: string | null;
    activeOrders: number;
    dishes: MenuDish[];
  };
}

export interface FillResult {
  created: number;
  overwritten: number;
  skipped: number;
}

export interface MenuTemplateItem {
  week: number;
  weekday: number;
  dishId: string;
  dish: MenuDish;
}

export interface MenuTemplate {
  id: string;
  name: string;
  weeks: number;
  active: boolean;
  items: MenuTemplateItem[];
}

export interface OrderItem {
  courseId: string;
  courseName: string;
  dishId: string;
  dishName: string;
}

export interface MealOrder {
  id: string;
  childId: string;
  date: string;
  complex: { id: string; name: string };
  price: string;
  items: OrderItem[];
  createdAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface AdminMealOrder extends MealOrder {
  child: PersonRef;
  group: { id: string; name: string } | null;
  createdBy: PersonRef & { role: string };
  cancelledBy: PersonRef | null;
}

export interface MealSummary {
  complexes: { complexId: string; name: string; count: number }[];
  dishes: { dishId: string; name: string; courseName: string; count: number }[];
}

export interface TodayOrders {
  date: string;
  orders: { id: string; child: PersonRef; complex: { id: string; name: string }; items: OrderItem[] }[];
  summary: MealSummary;
}

export interface OrderDay {
  date: string;
  complexId: string;
  dishIds: string[];
}

export interface ParentMenuComplex {
  id: string;
  name: string;
  description: string | null;
  price: string;
  courses: { id: string; name: string; options: { id: string; name: string }[] }[];
}

export interface ParentMenuDay {
  date: string;
  deadlineAt: string;
  open: boolean;
  dishes: { id: string; name: string; course: CourseRef }[];
  complexes: ParentMenuComplex[];
  order: MealOrder | null;
  canOrder: boolean;
  canCancel: boolean;
}

export interface ParentMenu {
  deadline: string;
  days: ParentMenuDay[];
}

export const mealsApi = {
  getCourses: () => axiosInstance.get<MealCourse[]>('/meal-courses'),
  createCourse: (dto: SortedNamedDto) => axiosInstance.post<MealCourse>('/meal-courses', dto),
  updateCourse: (id: string, dto: SortedNamedDto) => axiosInstance.patch<MealCourse>(`/meal-courses/${id}`, dto),
  getDishes: () => axiosInstance.get<Dish[]>('/dishes'),
  createDish: (dto: DishDto) => axiosInstance.post<Dish>('/dishes', dto),
  updateDish: (id: string, dto: DishDto) => axiosInstance.patch<Dish>(`/dishes/${id}`, dto),
  getPriceCategories: () => axiosInstance.get<MealPriceCategory[]>('/meal-price-categories'),
  createPriceCategory: (dto: SortedNamedDto) => axiosInstance.post<MealPriceCategory>('/meal-price-categories', dto),
  updatePriceCategory: (id: string, dto: SortedNamedDto) =>
    axiosInstance.patch<MealPriceCategory>(`/meal-price-categories/${id}`, dto),
  getComplexes: () => axiosInstance.get<MealComplex[]>('/meal-complexes'),
  createComplex: (dto: MealComplexDto) => axiosInstance.post<MealComplex>('/meal-complexes', dto),
  updateComplex: (id: string, dto: MealComplexDto) => axiosInstance.patch<MealComplex>(`/meal-complexes/${id}`, dto),
  addPrice: (id: string, dto: ComplexPriceDto) => axiosInstance.post<MealComplex>(`/meal-complexes/${id}/prices`, dto),
  deletePrice: (id: string, priceId: string) =>
    axiosInstance.delete<MealComplex>(`/meal-complexes/${id}/prices/${priceId}`),
  getSettings: () => axiosInstance.get<{ mealOrderDeadline: string }>('/meals/settings'),
  updateSettings: (mealOrderDeadline: string) =>
    axiosInstance.patch<{ mealOrderDeadline: string }>('/meals/settings', { mealOrderDeadline }),
  getMenuDays: (kind: GroupKind, from: string, to: string) =>
    axiosInstance.get<MenuDayView[]>('/menu-days', { params: { kind, from, to } }),
  saveMenuDay: (date: string, kind: GroupKind, dishIds: string[]) =>
    axiosInstance.put<MenuDayView>(`/menu-days/${date}/${kind}`, { dishIds }),
  deleteMenuDay: (date: string, kind: GroupKind) => axiosInstance.delete(`/menu-days/${date}/${kind}`),
  publish: (kind: GroupKind, from: string, to: string) =>
    axiosInstance.post<{ count: number }>('/menu-days/publish', { kind, from, to }),
  unpublish: (kind: GroupKind, from: string, to: string) =>
    axiosInstance.post<{ count: number }>('/menu-days/unpublish', { kind, from, to }),
  copy: (dto: { kind: GroupKind; fromStart: string; fromEnd: string; toStart: string; overwrite: boolean }) =>
    axiosInstance.post<FillResult>('/menu-days/copy', dto),
  getTemplates: () => axiosInstance.get<MenuTemplate[]>('/menu-templates'),
  createTemplate: (dto: { name: string; weeks: number }) => axiosInstance.post<MenuTemplate>('/menu-templates', dto),
  updateTemplate: (id: string, dto: { name?: string; weeks?: number; active?: boolean }) =>
    axiosInstance.patch<MenuTemplate>(`/menu-templates/${id}`, dto),
  saveTemplateItems: (id: string, items: { week: number; weekday: number; dishId: string }[]) =>
    axiosInstance.put<MenuTemplate>(`/menu-templates/${id}/items`, { items }),
  applyTemplate: (
    id: string,
    dto: { kind: GroupKind; from: string; to: string; startWeek: number; overwrite: boolean },
  ) => axiosInstance.post<FillResult>(`/menu-templates/${id}/apply`, dto),
  getOrders: (date: string, kind?: GroupKind, groupId?: string) =>
    axiosInstance.get<{ orders: AdminMealOrder[]; summary: MealSummary }>('/meal-orders', {
      params: { date, kind: kind || undefined, groupId: groupId || undefined },
    }),
  createOrders: (childId: string, days: OrderDay[]) =>
    axiosInstance.post<MealOrder[]>('/meal-orders', { childId, days }),
  cancelOrder: (id: string, reason?: string) =>
    axiosInstance.post<MealOrder>(`/meal-orders/${id}/cancel`, reason ? { reason } : {}),
  getToday: (groupId: string) => axiosInstance.get<TodayOrders>('/meal-orders/today', { params: { groupId } }),
  getParentMenu: (childId: string, from: string, to: string) =>
    axiosInstance.get<ParentMenu>(`/me/children/${childId}/menu`, { params: { from, to } }),
  parentOrder: (childId: string, days: OrderDay[]) =>
    axiosInstance.post<MealOrder[]>(`/me/children/${childId}/meal-orders`, { days }),
  parentCancel: (childId: string, orderId: string) =>
    axiosInstance.post<MealOrder>(`/me/children/${childId}/meal-orders/${orderId}/cancel`),
};
