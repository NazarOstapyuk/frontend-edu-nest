import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { RequireAuth } from './RequireAuth'
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
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true,       element: <DashboardPage /> },
          { path: 'users',     element: <UsersPage /> },
          { path: 'students',  element: <EmptyPage title="Учні" /> },
          { path: 'teachers',  element: <EmptyPage title="Вчителі" /> },
          { path: 'classes',   element: <EmptyPage title="Класи" /> },
          { path: 'schedule',  element: <EmptyPage title="Розклад" /> },
          { path: 'grades',    element: <EmptyPage title="Оцінки" /> },
          { path: 'reports',   element: <EmptyPage title="Звіти" /> },
          { path: 'settings',  element: <EmptyPage title="Налаштування" /> },
          { path: '*',         element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
