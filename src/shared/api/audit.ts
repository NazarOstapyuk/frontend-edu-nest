import { axiosInstance } from './axiosInstance';

export interface PersonLogin {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
}

export interface FieldChange {
  field: string;
  before: string | null;
  after: string | null;
}

export interface AuditChange {
  id: string;
  at: string;
  requestId: string;
  actor?: PersonLogin | null;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'void';
  changes: FieldChange[];
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: PersonLogin | null;
  actorRole: string | null;
  method: string;
  route: string;
  entityType: string | null;
  entityId: string | null;
  statusCode: number;
  ip: string | null;
  userAgent: string | null;
  body: unknown;
}

export interface AuditEventDetail extends AuditEvent {
  changes: AuditChange[];
}

export type AuthEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'refresh_failed';

export interface AuthEvent {
  id: string;
  at: string;
  user: PersonLogin | null;
  login: string;
  type: AuthEventType;
  reason: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
}

export interface AuditEventsQuery {
  from?: string;
  to?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  failedOnly?: 'true';
  page?: number;
}

export interface AuthEventsQuery {
  from?: string;
  to?: string;
  login?: string;
  type?: AuthEventType;
  page?: number;
}

export const authTypeLabels: Record<AuthEventType, string> = {
  login_success: 'Вхід',
  login_failed: 'Невдалий вхід',
  logout: 'Вихід',
  password_changed: 'Зміна пароля',
  refresh_failed: 'Сесію не продовжено',
};

export const authReasonLabels: Record<string, string> = {
  invalid_credentials: 'неправильний логін або пароль',
  account_disabled: 'обліковий запис вимкнено',
  invalid_refresh: 'недійсна сесія',
};

export const entityTypeLabels: Record<string, string> = {
  users: 'Користувачі',
  children: 'Діти',
  groups: 'Групи',
  tariffs: 'Тарифи',
  enrollments: 'Договори',
  'salary-terms': 'Умови оплати',
  payroll: 'Зарплати',
  charges: 'Нарахування',
  payments: 'Оплати',
  'meal-orders': 'Замовлення харчування',
  'menu-days': 'Меню',
  settings: 'Налаштування',
  backups: 'Резервні копії',
};

const methodVerb: Record<string, string> = {
  POST: 'Створено',
  PUT: 'Збережено',
  PATCH: 'Змінено',
  DELETE: 'Видалено',
};

const routeLabels: Record<string, string> = {
  'POST /children/:childId/payments': 'Прийнято оплату',
  'POST /children/:childId/charges': 'Створено нарахування',
  'POST /charges/:id/void': 'Анульовано нарахування',
  'POST /payments/:id/void': 'Анульовано оплату',
  'PATCH /users/:id/access': 'Змінено доступ',
  'PUT /groups/:id/register': 'Збережено журнал',
  'POST /billing/run': 'Запущено нарахування',
  'POST /backups': 'Створено резервну копію',
  'POST /payroll/:teacherId/:month/approve': 'Затверджено відомість',
};

export const actionLabel = (route: string): string => {
  if (routeLabels[route]) return routeLabels[route];
  const [method, path] = route.split(' ');
  const entity = path?.split('/').filter(Boolean)[0] ?? '';
  const verb = methodVerb[method];
  const label = entityTypeLabels[entity];
  return verb && label ? `${verb}: ${label}` : route;
};

export const auditApi = {
  events: (query: AuditEventsQuery) =>
    axiosInstance.get<Paged<AuditEvent>>('/audit/events', { params: query }),
  event: (id: string) => axiosInstance.get<AuditEventDetail>(`/audit/events/${id}`),
  changes: (entityType: string, entityId: string, page = 1) =>
    axiosInstance.get<Paged<AuditChange>>('/audit/changes', { params: { entityType, entityId, page } }),
  auth: (query: AuthEventsQuery) => axiosInstance.get<Paged<AuthEvent>>('/audit/auth', { params: query }),
};
