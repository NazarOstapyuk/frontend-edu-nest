# Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Створити сторінку авторизації `/login` з формою логін/пароль поза AdminLayout.

**Architecture:** Окремий маршрут `/login` рендерить `LoginPage` без Sidebar/Header. Форма валідується через yup + react-hook-form. Після сабміту — `navigate('/')` (заглушка до появи реального auth API).

**Tech Stack:** React 19, TypeScript, MUI 9, react-hook-form 7, yup 1, react-router-dom 7

---

## File Map

| Дія | Файл |
|-----|------|
| Create | `src/pages/login/ui/LoginPage.tsx` |
| Create | `src/pages/login/index.ts` |
| Modify | `src/app/router/index.tsx` |

---

### Task 1: Створити компонент LoginPage

**Files:**
- Create: `src/pages/login/ui/LoginPage.tsx`
- Create: `src/pages/login/index.ts`

> Проект не має тестового фреймворку (немає vitest/jest у devDependencies), тому кроки TDD пропущено.

- [ ] **Step 1: Створити `src/pages/login/ui/LoginPage.tsx`**

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

const schema = yup.object({
  login: yup.string().required('Введіть логін'),
  password: yup.string().min(6, 'Мінімум 6 символів').required('Введіть пароль'),
})

type FormData = yup.InferType<typeof schema>

export const LoginPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = (_data: FormData) => {
    navigate('/')
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
          sx={{ mt: 1 }}
        >
          Увійти
        </Button>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Створити `src/pages/login/index.ts`**

```ts
export { LoginPage } from './ui/LoginPage'
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/login/
git commit -m "feat: add LoginPage component"
```

---

### Task 2: Підключити маршрут /login до роутера

**Files:**
- Modify: `src/app/router/index.tsx`

- [ ] **Step 1: Оновити `src/app/router/index.tsx`**

Додати імпорт та маршрут `/login` перед `AdminLayout`:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { DashboardPage } from '../../pages/dashboard'
import { UsersPage } from '../../pages/users'
import { EmptyPage } from '../../shared/ui/EmptyPage'
import { LoginPage } from '../../pages/login'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true,           element: <DashboardPage /> },
      { path: 'users',         element: <UsersPage /> },
      { path: 'students',      element: <EmptyPage title="Учні" /> },
      { path: 'teachers',      element: <EmptyPage title="Вчителі" /> },
      { path: 'classes',       element: <EmptyPage title="Класи" /> },
      { path: 'schedule',      element: <EmptyPage title="Розклад" /> },
      { path: 'grades',        element: <EmptyPage title="Оцінки" /> },
      { path: 'reports',       element: <EmptyPage title="Звіти" /> },
      { path: 'settings',      element: <EmptyPage title="Налаштування" /> },
      { path: '*',             element: <Navigate to="/" replace /> },
    ],
  },
])
```

- [ ] **Step 2: Перевірити у браузері**

```bash
npm run dev
```

Відкрити `http://localhost:5173/login` — має з'явитись картка авторизації.
Перевірити:
- Порожня форма → кнопка "Увійти" → з'являються помилки під полями
- Пароль < 6 символів → помилка "Мінімум 6 символів"
- Коректні дані → редирект на `/`
- Кнопка ока → перемикає видимість пароля

- [ ] **Step 3: Commit**

```bash
git add src/app/router/index.tsx
git commit -m "feat: add /login route to router"
```
