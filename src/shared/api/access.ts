export type PermissionArea =
  | 'users'
  | 'children'
  | 'finance'
  | 'tariffs'
  | 'classes'
  | 'register'
  | 'timetable'
  | 'meals'
  | 'payroll'
  | 'backups'
  | 'settings'
  | 'audit';
export type PermissionLevel = 'view' | 'edit';
export type AccessScope = 'all' | 'kindergarten' | 'school_class';
export type PermissionMap = Partial<Record<PermissionArea, PermissionLevel>>;

export interface PermissionItem {
  area: PermissionArea;
  level: PermissionLevel;
}

export interface UpdateAccessDto {
  accessScope: AccessScope;
  permissions: PermissionItem[];
}

export const areaLabels: Record<PermissionArea, string> = {
  users: 'Користувачі',
  children: 'Діти й групи',
  finance: 'Фінанси',
  tariffs: 'Тарифи й договори',
  classes: 'Гуртки й пакети',
  register: 'Журнал відвідування',
  timetable: 'Розклад школи',
  meals: 'Харчування',
  payroll: 'Зарплати',
  backups: 'Резервні копії',
  settings: 'Налаштування',
  audit: 'Історія змін',
};

export const ALL_AREAS = Object.keys(areaLabels) as PermissionArea[];

export const levelLabels: Record<PermissionLevel, string> = {
  view: 'Перегляд',
  edit: 'Зміна',
};

export const scopeLabels: Record<AccessScope, string> = {
  all: 'Усе',
  kindergarten: 'Садочок',
  school_class: 'Школа',
};

const RANK: Record<PermissionLevel, number> = { view: 1, edit: 2 };

export const levelSatisfies = (have: PermissionLevel | undefined, need: PermissionLevel) =>
  have !== undefined && RANK[have] >= RANK[need];

export interface AccessTemplate {
  name: string;
  accessScope: AccessScope;
  permissions: PermissionMap;
}

const all = (level: PermissionLevel): PermissionMap =>
  Object.fromEntries(ALL_AREAS.map((area) => [area, level]));

export const accessTemplates: AccessTemplate[] = [
  { name: 'Адміністратор', accessScope: 'all', permissions: all('edit') },
  {
    name: 'Бухгалтер',
    accessScope: 'all',
    permissions: { finance: 'edit', tariffs: 'edit', payroll: 'edit', children: 'view' },
  },
  {
    name: 'Завуч школи',
    accessScope: 'school_class',
    permissions: { register: 'edit', timetable: 'edit', children: 'edit' },
  },
  {
    name: 'Керівник садочка',
    accessScope: 'kindergarten',
    permissions: { register: 'edit', children: 'edit', meals: 'edit', finance: 'view' },
  },
  { name: 'Відповідальний за харчування', accessScope: 'all', permissions: { meals: 'edit' } },
];
