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
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import StyleIcon from '@mui/icons-material/Style'
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
  { path: '/students',            label: 'Учні',              icon: PeopleIcon },
  { path: '/subscriptions',       label: 'Абонементи',        icon: CardMembershipIcon },
  { path: '/subscription-types',  label: 'Типи абонементів',  icon: StyleIcon },
]

export const bottomNavItems: NavItem[] = [
  { path: '/settings', label: 'Налаштування', icon: SettingsIcon },
]
