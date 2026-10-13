import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import SettingsIcon from '@mui/icons-material/Settings'
import GroupsIcon from '@mui/icons-material/Groups'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PriceChangeIcon from '@mui/icons-material/PriceChange'
import CastleIcon from '@mui/icons-material/Castle'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import PaymentsIcon from '@mui/icons-material/Payments'
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import ViewWeekIcon from '@mui/icons-material/ViewWeek'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import TuneIcon from '@mui/icons-material/Tune'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import type { SvgIconComponent } from '@mui/icons-material'
import type { SessionRole } from '../../../entities/user'

export interface NavItem {
  label: string
  icon: SvgIconComponent
  path: string
  roles?: SessionRole[]
  badge?: 'pendingNotices'
}

const ADMIN: SessionRole[] = ['root', 'admin']

export const navItems: NavItem[] = [
  { path: '/',                    label: 'Дашборд',           icon: DashboardIcon },
  { path: '/register',            label: 'Журнал',            icon: FactCheckIcon,      roles: ['root', 'admin', 'teacher'] },
  { path: '/schedule',           label: 'Розклад',           icon: ViewWeekIcon,       roles: ADMIN },
  { path: '/meals',              label: 'Харчування',        icon: RestaurantIcon,     roles: ADMIN },
  { path: '/payroll',            label: 'Зарплати',          icon: PaymentsIcon,       roles: ADMIN },
  { path: '/absence-notices',     label: 'Повідомлення',      icon: MarkEmailUnreadIcon, roles: ADMIN, badge: 'pendingNotices' },
  { path: '/users',               label: 'Користувачі',       icon: ManageAccountsIcon, roles: ADMIN },
  { path: '/groups',              label: 'Групи',             icon: GroupsIcon,         roles: ADMIN },
  { path: '/students',            label: 'Учні',              icon: PeopleIcon,         roles: ADMIN },
  { path: '/finance',             label: 'Фінанси',           icon: AccountBalanceWalletIcon, roles: ADMIN },
  { path: '/tariffs',             label: 'Тарифи',            icon: PriceChangeIcon,    roles: ADMIN },
  { path: '/classes',             label: 'Гуртки',            icon: CastleIcon,         roles: ADMIN },
  { path: '/my-classes',          label: 'Мої заняття',       icon: EventAvailableIcon, roles: ['teacher'] },
  { path: '/my-lessons',         label: 'Мої уроки',         icon: MenuBookIcon,       roles: ['teacher'] },
  { path: '/my-payroll',         label: 'Моя зарплата',      icon: RequestQuoteIcon,   roles: ['teacher'] },
  { path: '/calendar',            label: 'Календар',          icon: CalendarMonthIcon,  roles: ADMIN },
  { path: '/schedule-setup',     label: 'Довідники розкладу', icon: TuneIcon,          roles: ADMIN },
  { path: '/absence-reasons',     label: 'Причини відсутності', icon: PlaylistAddCheckIcon, roles: ADMIN },
]

export const bottomNavItems: NavItem[] = [
  { path: '/settings', label: 'Налаштування', icon: SettingsIcon, roles: ADMIN },
]
