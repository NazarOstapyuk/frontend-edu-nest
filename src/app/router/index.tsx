import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { ParentLayout } from '../layouts/ParentLayout'
import { RoleLayout } from '../layouts/RoleLayout'
import { RequireAuth } from './RequireAuth'
import { RoleGate } from './RoleGate'
import { PasswordGate } from './PasswordGate'
import { DashboardPage } from '../../pages/dashboard'
import { UsersPage } from '../../pages/users'
import { GroupsPage } from '../../pages/groups'
import { ChildrenPage } from '../../pages/children'
import { ChildFinancePage, FinanceBalancesPage } from '../../pages/finance'
import { TariffsPage } from '../../pages/tariffs'
import { ClassesPage } from '../../pages/classes'
import { ClassGroupPage, MarkLessonPage } from '../../pages/classGroup'
import { MyClassesPage } from '../../pages/myClasses'
import { ProfilePage } from '../../pages/profile'
import { ChangePasswordPage } from '../../pages/changePassword'
import { FamilyPage } from '../../pages/family'
import { FamilyChildPage } from '../../pages/familyChild'
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
      { path: 'change-password', element: <ChangePasswordPage /> },
      {
        element: <PasswordGate />,
        children: [
          {
            path: 'profile',
            element: <RoleLayout />,
            children: [{ index: true, element: <ProfilePage /> }],
          },
          {
            element: <RoleGate roles={['parent']} redirectTo="/" />,
            children: [
              {
                element: <ParentLayout />,
                children: [
                  { path: 'family', element: <FamilyPage /> },
                  { path: 'family/:childId', element: <FamilyChildPage /> },
                ],
              },
            ],
          },
          {
            element: <RoleGate roles={['root', 'admin', 'teacher']} redirectTo="/family" />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true,       element: <DashboardPage /> },
                  { path: 'users',     element: <UsersPage /> },
                  { path: 'groups',    element: <GroupsPage /> },
                  { path: 'students',            element: <ChildrenPage /> },
                  { path: 'finance',             element: <FinanceBalancesPage /> },
                  { path: 'finance/:childId',    element: <ChildFinancePage /> },
                  { path: 'tariffs',             element: <TariffsPage /> },
                  { path: 'teachers',            element: <EmptyPage title="Вчителі" /> },
                  { path: 'classes',   element: <ClassesPage /> },
                  { path: 'classes/:groupId',               element: <ClassGroupPage /> },
                  { path: 'classes/:groupId/lessons/:date', element: <MarkLessonPage /> },
                  { path: 'my-classes',                     element: <MyClassesPage /> },
                  { path: 'schedule',  element: <EmptyPage title="Розклад" /> },
                  { path: 'grades',    element: <EmptyPage title="Оцінки" /> },
                  { path: 'reports',   element: <EmptyPage title="Звіти" /> },
                  { path: 'settings',  element: <EmptyPage title="Налаштування" /> },
                  { path: '*',         element: <Navigate to="/" replace /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
