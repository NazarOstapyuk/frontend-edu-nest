import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { ParentLayout } from '../layouts/ParentLayout'
import { RoleLayout } from '../layouts/RoleLayout'
import { RequireAuth } from './RequireAuth'
import { RoleGate } from './RoleGate'
import { PasswordGate } from './PasswordGate'
import { DashboardPage } from '../../pages/dashboard'
import { UsersPage } from '../../pages/users'
import { PositionsPage } from '../../pages/positions'
import { GroupsPage } from '../../pages/groups'
import { ChildrenPage } from '../../pages/children'
import { ChildFinancePage, FinanceBalancesPage } from '../../pages/finance'
import { TariffsPage } from '../../pages/tariffs'
import { ClassesPage } from '../../pages/classes'
import { ClassGroupPage, MarkLessonPage } from '../../pages/classGroup'
import { AbsenceReasonsPage } from '../../pages/absenceReasons'
import { CalendarPage } from '../../pages/calendar'
import { ScheduleSetupPage } from '../../pages/scheduleSetup'
import { SchedulePage } from '../../pages/schedule'
import { MealsPage } from '../../pages/meals'
import { RoutinePage } from '../../pages/routine'
import { PayrollPage } from '../../pages/payroll'
import { InstitutionsPage } from '../../pages/institutions'
import { BackupsPage } from '../../pages/backups'
import { AuditPage } from '../../pages/audit'
import { ReportsPage } from '../../pages/reports'
import { RegisterPage } from '../../pages/register'
import { AbsenceNoticesPage } from '../../pages/absenceNotices'
import { MyLessonsPage } from '../../pages/myLessons'
import { MyPayrollPage } from '../../pages/myPayroll'
import { LessonPage } from '../../pages/lesson'
import { MyClassesPage } from '../../pages/myClasses'
import { ProfilePage } from '../../pages/profile'
import { ChangePasswordPage } from '../../pages/changePassword'
import { FamilyPage } from '../../pages/family'
import { FamilyChildPage } from '../../pages/familyChild'
import { EmptyPage } from '../../shared/ui/EmptyPage'
import { LoginPage } from '../../pages/login'
import { PayLinkPage, TestBankPage } from '../../pages/pay'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/pay/test/:invoiceId',
    element: <TestBankPage />,
  },
  {
    path: '/pay/:token',
    element: <PayLinkPage />,
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
                  { path: 'register',  element: <RegisterPage /> },
                  { path: 'absence-notices', element: <AbsenceNoticesPage /> },
                  { path: 'users',     element: <UsersPage /> },
                  { path: 'positions', element: <PositionsPage /> },
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
                  { path: 'my-lessons',                     element: <MyLessonsPage /> },
                  { path: 'my-payroll',                     element: <MyPayrollPage /> },
                  { path: 'lessons/:groupId/:date/:period', element: <LessonPage /> },
                  { path: 'calendar',        element: <CalendarPage /> },
                  { path: 'schedule-setup', element: <ScheduleSetupPage /> },
                  { path: 'absence-reasons', element: <AbsenceReasonsPage /> },
                  { path: 'schedule',  element: <SchedulePage /> },
                  { path: 'routine', element: <RoutinePage /> },
                  { path: 'meals', element: <MealsPage /> },
                  { path: 'payroll', element: <PayrollPage /> },
                  { path: 'institutions', element: <InstitutionsPage /> },
                  { path: 'backups', element: <BackupsPage /> },
                  { path: 'audit', element: <AuditPage /> },
                  { path: 'grades',    element: <EmptyPage title="Оцінки" /> },
                  { path: 'reports',   element: <ReportsPage /> },
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
