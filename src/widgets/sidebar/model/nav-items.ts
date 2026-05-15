import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import SchoolIcon from '@mui/icons-material/School'
import ClassIcon from '@mui/icons-material/Class'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AssignmentIcon from '@mui/icons-material/Assignment'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'
import GroupsIcon from '@mui/icons-material/Groups'
import type { SvgIconComponent } from '@mui/icons-material'

export interface NavItem {
  label: string
  icon: SvgIconComponent
  path: string
}

export const navItems: NavItem[] = [
  { path: '/',          label: 'Дашборд',    icon: DashboardIcon },
  { path: '/users',     label: 'Користувачі', icon: ManageAccountsIcon },
  { path: '/groups',    label: 'Групи',       icon: GroupsIcon },
  { path: '/students',  label: 'Учні',        icon: PeopleIcon },
  { path: '/teachers',  label: 'Вчителі',    icon: SchoolIcon },
  { path: '/classes',   label: 'Класи',      icon: ClassIcon },
  { path: '/schedule',  label: 'Розклад',    icon: CalendarMonthIcon },
  { path: '/grades',    label: 'Оцінки',     icon: AssignmentIcon },
  { path: '/reports',   label: 'Звіти',      icon: BarChartIcon },
]

export const bottomNavItems: NavItem[] = [
  { path: '/settings', label: 'Налаштування', icon: SettingsIcon },
]
