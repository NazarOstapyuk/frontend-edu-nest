# Auth Guards & Role-Based Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Захистити маршрути через AuthContext + route guards, з відновленням сесії через `auth/me` при старті.

**Architecture:** `AuthProvider` робить `GET /auth/me` при mount, зберігає `AuthUser | null` в React Context. `RequireAuth` блокує доступ без юзера, `RequireRole` — без потрібної ролі. `LoginPage` викликає `context.login()` замість прямого navigate.

**Tech Stack:** React 19, TypeScript, MUI 9, react-router-dom 7

---

## File Map

| Дія | Файл | Відповідальність |
|-----|------|-----------------|
| Create | `src/app/providers/auth/AuthContext.ts` | Типи + createContext |
| Create | `src/app/providers/auth/AuthProvider.tsx` | Провайдер + init запит |
| Create | `src/app/providers/auth/useAuth.ts` | useContext хук |
| Create | `src/app/providers/auth/index.ts` | Barrel export |
| Create | `src/app/router/guards/RequireAuth.tsx` | Перевірка наявності юзера |
| Create | `src/app/router/guards/RequireRole.tsx` | Перевірка ролі |
| Modify | `src/App.tsx` | Обгортка AuthProvider |
| Modify | `src/app/router/index.tsx` | Підключення guards |
| Modify | `src/pages/login/ui/LoginPage.tsx` | Виклик context.login() |

---

### Task 1: Auth Context

**Files:**
- Create: `src/app/providers/auth/AuthContext.ts`
- Create: `src/app/providers/auth/AuthProvider.tsx`
- Create: `src/app/providers/auth/useAuth.ts`
- Create: `src/app/providers/auth/index.ts`

> Проект не має тестового фреймворку — кроки TDD пропущено.

- [ ] **Step 1: Створити `src/app/providers/auth/AuthContext.ts`**

```ts
import { createContext } from 'react'

export type AuthRole = 'root' | 'admin' | 'teacher' | 'parent'

export interface AuthUser {
  id: string
  role: AuthRole
}

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
```

- [ ] **Step 2: Створити `src/app/providers/auth/AuthProvider.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { AuthContext, AuthUser } from './AuthContext'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (login: string, password: string) => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    })
    if (!res.ok) throw new Error('Невірний логін або пароль')
    const data: AuthUser = await res.json()
    setUser(data)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 3: Створити `src/app/providers/auth/useAuth.ts`**

```ts
import { useContext } from 'react'
import { AuthContext, AuthContextValue } from './AuthContext'

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Створити `src/app/providers/auth/index.ts`**

```ts
export { AuthProvider } from './AuthProvider'
export { useAuth } from './useAuth'
export type { AuthUser, AuthRole } from './AuthContext'
```

- [ ] **Step 5: Перевірити TypeScript**

```bash
npx tsc --noEmit
```

Очікується: без помилок.

- [ ] **Step 6: Commit**

```bash
git add src/app/providers/auth/
git commit -m "feat: add AuthContext, AuthProvider, useAuth"
```

---

### Task 2: Route Guards

**Files:**
- Create: `src/app/router/guards/RequireAuth.tsx`
- Create: `src/app/router/guards/RequireRole.tsx`

- [ ] **Step 1: Створити `src/app/router/guards/RequireAuth.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../../providers/auth'

export const RequireAuth = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
```

- [ ] **Step 2: Створити `src/app/router/guards/RequireRole.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../providers/auth'
import type { AuthRole } from '../../providers/auth'

interface Props {
  roles: AuthRole[]
}

export const RequireRole = ({ roles }: Props) => {
  const { user } = useAuth()

  return user && roles.includes(user.role)
    ? <Outlet />
    : <Navigate to="/" replace />
}
```

- [ ] **Step 3: Перевірити TypeScript**

```bash
npx tsc --noEmit
```

Очікується: без помилок.

- [ ] **Step 4: Commit**

```bash
git add src/app/router/guards/
git commit -m "feat: add RequireAuth and RequireRole route guards"
```

---

### Task 3: Підключити AuthProvider в App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Оновити `src/App.tsx`**

```tsx
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './app/providers/auth'
import { router } from './app/router'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wrap app with AuthProvider"
```

---

### Task 4: Підключити guards у роутері

**Files:**
- Modify: `src/app/router/index.tsx`

- [ ] **Step 1: Оновити `src/app/router/index.tsx`**

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { DashboardPage } from '../../pages/dashboard'
import { UsersPage } from '../../pages/users'
import { EmptyPage } from '../../shared/ui/EmptyPage'
import { LoginPage } from '../../pages/login'
import { RequireAuth } from './guards/RequireAuth'
import { RequireRole } from './guards/RequireRole'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole roles={['root', 'admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true,         element: <DashboardPage /> },
              { path: 'users',       element: <UsersPage /> },
              { path: 'students',    element: <EmptyPage title="Учні" /> },
              { path: 'teachers',    element: <EmptyPage title="Вчителі" /> },
              { path: 'classes',     element: <EmptyPage title="Класи" /> },
              { path: 'schedule',    element: <EmptyPage title="Розклад" /> },
              { path: 'grades',      element: <EmptyPage title="Оцінки" /> },
              { path: 'reports',     element: <EmptyPage title="Звіти" /> },
              { path: 'settings',    element: <EmptyPage title="Налаштування" /> },
              { path: '*',           element: <Navigate to="/" replace /> },
            ],
          },
        ],
      },
    ],
  },
])
```

- [ ] **Step 2: Перевірити TypeScript**

```bash
npx tsc --noEmit
```

Очікується: без помилок.

- [ ] **Step 3: Commit**

```bash
git add src/app/router/index.tsx
git commit -m "feat: protect routes with RequireAuth and RequireRole guards"
```

---

### Task 5: Оновити LoginPage — виклик context.login()

**Files:**
- Modify: `src/pages/login/ui/LoginPage.tsx`

- [ ] **Step 1: Замінити вміст `src/pages/login/ui/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useAuth } from '../../../app/providers/auth'

const schema = yup.object({
  login: yup.string().required('Введіть логін'),
  password: yup.string().min(6, 'Мінімум 6 символів').required('Введіть пароль'),
})

type FormData = yup.InferType<typeof schema>

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async ({ login, password }: FormData) => {
    try {
      setAuthError(false)
      await authLogin(login, password)
      navigate('/')
    } catch {
      setAuthError(true)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          p: '40px 36px',
          width: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 0.5,
          }}
        >
          <SchoolIcon sx={{ color: '#fff', fontSize: 28 }} />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
          EduNest
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
          Вхід до системи
        </Typography>

        {authError && (
          <Alert severity="error" sx={{ width: '100%' }}>
            Невірний логін або пароль
          </Alert>
        )}

        <TextField
          {...register('login')}
          label="Логін"
          fullWidth
          error={!!errors.login}
          helperText={errors.login?.message}
          autoComplete="username"
        />

        <TextField
          {...register('password')}
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          autoComplete="current-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 1 }}
        >
          {isSubmitting ? 'Вхід...' : 'Увійти'}
        </Button>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Перевірити TypeScript**

```bash
npx tsc --noEmit
```

Очікується: без помилок.

- [ ] **Step 3: Перевірити у браузері**

```bash
npm run dev
```

- Відкрити `http://localhost:5173/` → має перекинути на `/login` (бо `auth/me` поверне 401 або мережеву помилку)
- На `/login` ввести будь-які дані → кнопка показує "Вхід..." → потім "Невірний логін або пароль"

- [ ] **Step 4: Commit**

```bash
git add src/pages/login/ui/LoginPage.tsx
git commit -m "feat: connect LoginPage to AuthContext"
```
