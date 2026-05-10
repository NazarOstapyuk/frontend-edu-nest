# Auth Guards & Role-Based Access Design

## Overview

Захист маршрутів через httpOnly cookie (токен на беку). Фронт зберігає стан авторизації в React Context. При старті апки — запит `auth/me` для відновлення сесії. Route guards перевіряють наявність юзера та його роль.

## Ролі

```typescript
type AuthRole = 'root' | 'admin' | 'teacher' | 'parent'
```

Доступ до `/` та `/users` — лише `root` і `admin`.

## Auth Context

```typescript
interface AuthUser {
  id: string
  role: AuthRole
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => void
}
```

- `AuthProvider` при mount робить `GET auth/me`: якщо 200 → зберігає юзера; якщо 401 → `user = null`
- Поки запит іде — `isLoading: true` (блокує рендер роутів щоб не було flash)
- `login()` — `POST auth/login`, отримує `AuthUser`, зберігає в стейт
- `logout()` — очищає `user` зі стейту

## Route Guards

**`RequireAuth`**
- `isLoading` → показує `<CircularProgress />` по центру
- `user === null` → `<Navigate to="/login" replace />`
- інакше → `<Outlet />`

**`RequireRole({ roles })`**
- `user.role` не входить в `roles` → `<Navigate to="/" replace />`
- інакше → `<Outlet />`

## Оновлений роутер

```
/login               → LoginPage (публічний, без guard)
/                    → RequireAuth
                       → RequireRole(['root', 'admin'])
                         → AdminLayout
                           index   → DashboardPage
                           /users  → UsersPage
                           ...     → EmptyPage / Navigate
```

## LoginPage — зміни

`onSubmit` тепер викликає `context.login(login, password)` замість прямого `navigate('/')`. Обробляє помилку (невірні дані) — показує MUI `Alert` під формою.

## FSD структура

```
src/app/providers/auth/
  AuthContext.ts        — createContext + тип
  AuthProvider.tsx      — провайдер + init запит
  useAuth.ts            — useContext хук
  index.ts              — barrel export

src/app/router/guards/
  RequireAuth.tsx
  RequireRole.tsx
```

`AuthProvider` підключається в `src/App.tsx` навколо `RouterProvider`.

## API endpoints

| Метод | URL | Відповідь |
|-------|-----|-----------|
| GET | `auth/me` | `AuthUser` або 401 |
| POST | `auth/login` | `AuthUser` або 401 |

## Поза скоупом

- `auth/logout` ендпоінт — окремий спек
- Refresh token логіка — окремий спек
- Сторінка 403 — окремий спек
