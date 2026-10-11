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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PriceChangeIcon from '@mui/icons-material/PriceChange'
import CastleIcon from '@mui/icons-material/Castle'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import type { SvgIconComponent } from '@mui/icons-material'
import type { SessionRole } from '../../../entities/user'

export interface NavItem {
  label: string
  icon: SvgIconComponent
  path: string
  roles?: SessionRole[]
}

const ADMIN: SessionRole[] = ['root', 'admin']

export const navItems: NavItem[] = [
  { path: '/',                    label: 'Дашборд',           icon: DashboardIcon },
  { path: '/users',               label: 'Користувачі',       icon: ManageAccountsIcon, roles: ADMIN },
  { path: '/groups',              label: 'Групи',             icon: GroupsIcon,         roles: ADMIN },
  { path: '/students',            label: 'Учні',              icon: PeopleIcon,         roles: ADMIN },
  { path: '/subscriptions',       label: 'Абонементи',        icon: CardMembershipIcon, roles: ADMIN },
  { path: '/subscription-types',  label: 'Типи абонементів',  icon: StyleIcon,          roles: ADMIN },
  { path: '/finance',             label: 'Фінанси',           icon: AccountBalanceWalletIcon, roles: ADMIN },
  { path: '/tariffs',             label: 'Тарифи',            icon: PriceChangeIcon,    roles: ADMIN },
  { path: '/classes',             label: 'Гуртки',            icon: CastleIcon,         roles: ADMIN },
  { path: '/my-classes',          label: 'Мої заняття',       icon: EventAvailableIcon, roles: ['teacher'] },
]

export const bottomNavItems: NavItem[] = [
  { path: '/settings', label: 'Налаштування', icon: SettingsIcon, roles: ADMIN },
]
