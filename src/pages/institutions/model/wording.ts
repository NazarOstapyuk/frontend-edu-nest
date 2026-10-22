import type { InstitutionType } from '../../../shared/api';

interface UnitWording {
  title: string;
  column: string;
  add: string;
  empty: string;
  create: string;
  edit: string;
}

export const unitWording: Record<InstitutionType, UnitWording> = {
  kindergarten: {
    title: 'Групи',
    column: 'Група',
    add: 'Додати групу',
    empty: 'Груп ще немає.',
    create: 'Нова група',
    edit: 'Редагувати групу',
  },
  school_class: {
    title: 'Класи',
    column: 'Клас',
    add: 'Додати клас',
    empty: 'Класів ще немає.',
    create: 'Новий клас',
    edit: 'Редагувати клас',
  },
};
