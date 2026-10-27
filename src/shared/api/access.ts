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
export type AccessScope = 'all' | 'institutions';
export type PermissionMap = Partial<Record<PermissionArea, PermissionLevel>>;

export interface PermissionItem {
  area: PermissionArea;
  level: PermissionLevel;
}

export interface UpdateAccessDto {
  positionId: string;
  accessScope: AccessScope;
  institutionIds?: string[];
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
  all: 'Усі заклади',
  institutions: 'Вибрані заклади',
};

const RANK: Record<PermissionLevel, number> = { view: 1, edit: 2 };

export const levelSatisfies = (have: PermissionLevel | undefined, need: PermissionLevel) =>
  have !== undefined && RANK[have] >= RANK[need];
