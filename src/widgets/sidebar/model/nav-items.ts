import HistoryIcon from '@mui/icons-material/History'
import BackupIcon from '@mui/icons-material/Backup'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import BadgeIcon from '@mui/icons-material/Badge'
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
import ScheduleIcon from '@mui/icons-material/Schedule'
import ViewWeekIcon from '@mui/icons-material/ViewWeek'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import TuneIcon from '@mui/icons-material/Tune'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import AssessmentIcon from '@mui/icons-material/Assessment'
import type { SvgIconComponent } from '@mui/icons-material'
import type { SessionRole } from '../../../entities/user'
import type { PermissionArea } from '../../../shared/api'

export type NavSection = 'people' | 'classes' | 'money' | 'settings'

export const navSectionLabels: Record<NavSection, string> = {
  people: 'Люди',
  classes: 'Заняття',
  money: 'Гроші',
  settings: 'Налаштування',
}

export interface NavItem {
  label: string
  icon: SvgIconComponent
  path: string
  roles?: SessionRole[]
  area?: PermissionArea
  areas?: PermissionArea[]
  badge?: 'pendingNotices'
  section?: NavSection
}

export const navItems: NavItem[] = [
  { path: '/',                    label: 'Сьогодні',           icon: DashboardIcon },
  { path: '/register',            label: 'Журнал',            icon: FactCheckIcon,      roles: ['teacher'], area: 'register' },
  { path: '/absence-notices',     label: 'Повідомлення',      icon: MarkEmailUnreadIcon, area: 'register', badge: 'pendingNotices' },
  { path: '/routine',            label: 'Розпорядок дня',    icon: ScheduleIcon,       roles: ['teacher'], area: 'timetable' },
  { path: '/schedule',           label: 'Розклад',           icon: ViewWeekIcon,       area: 'timetable' },
  { path: '/meals',              label: 'Харчування',        icon: RestaurantIcon,     area: 'meals' },
  { path: '/calendar',            label: 'Календар',          icon: CalendarMonthIcon,  area: 'register' },
  { path: '/students',            label: 'Учні',              icon: PeopleIcon,         area: 'children', section: 'people' },
  { path: '/groups',              label: 'Групи',             icon: GroupsIcon,         area: 'children', section: 'people' },
  { path: '/users',               label: 'Користувачі',       icon: ManageAccountsIcon, area: 'users', section: 'people' },
  { path: '/positions',           label: 'Посади',            icon: BadgeIcon,          area: 'users', section: 'people' },
  { path: '/classes',             label: 'Гуртки',            icon: CastleIcon,         area: 'classes', section: 'classes' },
  { path: '/my-classes',          label: 'Мої заняття',       icon: EventAvailableIcon, roles: ['teacher'], section: 'classes' },
  { path: '/my-lessons',         label: 'Мої уроки',         icon: MenuBookIcon,       roles: ['teacher'], section: 'classes' },
  { path: '/finance',             label: 'Фінанси',           icon: AccountBalanceWalletIcon, area: 'finance', section: 'money' },
  { path: '/tariffs',             label: 'Тарифи',            icon: PriceChangeIcon,    area: 'tariffs', section: 'money' },
  { path: '/payroll',            label: 'Зарплати',          icon: PaymentsIcon,       area: 'payroll', section: 'money' },
  { path: '/my-payroll',         label: 'Моя зарплата',      icon: RequestQuoteIcon,   roles: ['teacher'], section: 'money' },
  { path: '/reports',           label: 'Звіти',             icon: AssessmentIcon,     areas: ['finance', 'register', 'timetable', 'classes', 'meals', 'payroll'], section: 'money' },
]

export const bottomNavItems: NavItem[] = [
  { path: '/schedule-setup', label: 'Довідники розкладу', icon: TuneIcon, area: 'timetable', section: 'settings' },
  { path: '/absence-reasons', label: 'Причини відсутності', icon: PlaylistAddCheckIcon, area: 'register', section: 'settings' },
  { path: '/audit', label: 'Історія змін', icon: HistoryIcon, area: 'audit', section: 'settings' },
  { path: '/backups', label: 'Резервні копії', icon: BackupIcon, area: 'backups', section: 'settings' },
  { path: '/institutions', label: 'Заклади', icon: ApartmentIcon, areas: ['settings', 'children'], section: 'settings' },
  { path: '/settings', label: 'Налаштування', icon: SettingsIcon, area: 'settings', section: 'settings' },
]
