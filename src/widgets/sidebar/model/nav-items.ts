import HistoryIcon from '@mui/icons-material/History'
import BackupIcon from '@mui/icons-material/Backup'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import ApartmentIcon from '@mui/icons-material/Apartment'
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
import AssessmentIcon from '@mui/icons-material/Assessment'
import type { SvgIconComponent } from '@mui/icons-material'
import type { SessionRole } from '../../../entities/user'
import type { PermissionArea } from '../../../shared/api'

export interface NavItem {
  label: string
  icon: SvgIconComponent
  path: string
  roles?: SessionRole[]
  area?: PermissionArea
  areas?: PermissionArea[]
  badge?: 'pendingNotices'
}

export const navItems: NavItem[] = [
  { path: '/',                    label: 'Сьогодні',           icon: DashboardIcon },
  { path: '/register',            label: 'Журнал',            icon: FactCheckIcon,      roles: ['teacher'], area: 'register' },
  { path: '/schedule',           label: 'Розклад',           icon: ViewWeekIcon,       area: 'timetable' },
  { path: '/meals',              label: 'Харчування',        icon: RestaurantIcon,     area: 'meals' },
  { path: '/payroll',            label: 'Зарплати',          icon: PaymentsIcon,       area: 'payroll' },
  { path: '/absence-notices',     label: 'Повідомлення',      icon: MarkEmailUnreadIcon, area: 'register', badge: 'pendingNotices' },
  { path: '/users',               label: 'Користувачі',       icon: ManageAccountsIcon, area: 'users' },
  { path: '/groups',              label: 'Групи',             icon: GroupsIcon,         area: 'children' },
  { path: '/students',            label: 'Учні',              icon: PeopleIcon,         area: 'children' },
  { path: '/finance',             label: 'Фінанси',           icon: AccountBalanceWalletIcon, area: 'finance' },
  { path: '/tariffs',             label: 'Тарифи',            icon: PriceChangeIcon,    area: 'tariffs' },
  { path: '/classes',             label: 'Гуртки',            icon: CastleIcon,         area: 'classes' },
  { path: '/my-classes',          label: 'Мої заняття',       icon: EventAvailableIcon, roles: ['teacher'] },
  { path: '/my-lessons',         label: 'Мої уроки',         icon: MenuBookIcon,       roles: ['teacher'] },
  { path: '/my-payroll',         label: 'Моя зарплата',      icon: RequestQuoteIcon,   roles: ['teacher'] },
  { path: '/reports',           label: 'Звіти',             icon: AssessmentIcon,     areas: ['finance', 'register', 'timetable', 'classes', 'meals', 'payroll'] },
  { path: '/calendar',            label: 'Календар',          icon: CalendarMonthIcon,  area: 'register' },
  { path: '/schedule-setup',     label: 'Довідники розкладу', icon: TuneIcon,          area: 'timetable' },
  { path: '/absence-reasons',     label: 'Причини відсутності', icon: PlaylistAddCheckIcon, area: 'register' },
]

export const bottomNavItems: NavItem[] = [
  { path: '/audit', label: 'Історія змін', icon: HistoryIcon, area: 'audit' },
  { path: '/backups', label: 'Резервні копії', icon: BackupIcon, area: 'backups' },
  { path: '/institutions', label: 'Заклади', icon: ApartmentIcon, areas: ['settings', 'children'] },
  { path: '/settings', label: 'Налаштування', icon: SettingsIcon, area: 'settings' },
]
