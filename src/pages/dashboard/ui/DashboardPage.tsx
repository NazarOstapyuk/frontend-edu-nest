import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, ButtonBase, Grid, Paper, Skeleton, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import MoneyOffIcon from '@mui/icons-material/MoneyOff'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import PaymentsIcon from '@mui/icons-material/Payments'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import BackupIcon from '@mui/icons-material/Backup'
import EditNoteIcon from '@mui/icons-material/EditNote'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { dashboardApi, formatMoney } from '../../../shared/api'
import type { DashboardPaymentMethod, TodayDashboard } from '../../../shared/api'
import { useAuthStore, useCan } from '../../../entities/user'
import { brandColors, mascotUrl } from '../../../shared/assets/brand'
import { DashboardCard } from './DashboardCard'

const methodLabels: Record<DashboardPaymentMethod, string> = {
  cash: 'Готівка',
  bank_transfer: 'Переказ',
  card: 'Картка',
  online: 'Онлайн',
}

const methodOrder: DashboardPaymentMethod[] = ['cash', 'bank_transfer', 'card', 'online']

const childrenCount = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} дитина`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} дитини`
  return `${count} дітей`
}

const namesLine = (names: string[], more: number) =>
  names.join(', ') + (more > 0 ? ` і ще ${more}` : '')

interface AttentionRow {
  key: string
  to: string
  title: string
  meta: string
  action: string
  cta: string
  icon: SvgIconComponent
  alert: boolean
}

const kyivHour = () =>
  Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Kyiv' }).format(new Date()))

const greeting = () => {
  const hour = kyivHour()
  if (hour >= 5 && hour < 12) return 'Добрий ранок'
  if (hour >= 12 && hour < 18) return 'Добрий день'
  return 'Добрий вечір'
}

const dateLine = (date: string) => {
  const text = new Date(`${date}T00:00:00Z`).toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const tasksLine = (count: number) => {
  if (count === 0) return 'Сьогодні все спокійно.'
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `Сьогодні ${count} справа чекає на вас.`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `Сьогодні ${count} справи чекають на вас.`
  return `Сьогодні ${count} справ чекають на вас.`
}

const buildRows = (data: TodayDashboard): AttentionRow[] => {
  const { register, notices, debts, onlinePending, payroll, backups, notes, tasks } = data
  const rows: AttentionRow[] = []
  if (register) {
    rows.push(
      register.count > 0
        ? { key: 'register', to: '/register', title: `Журнал не відмічено: ${register.count}`, meta: namesLine(register.names, register.more), action: 'Відмітити', cta: 'Відкрити журнал', icon: FactCheckIcon, alert: true }
        : { key: 'register', to: '/register', title: 'Журнал', meta: 'Усі групи відмічено', action: 'Відкрити', cta: 'Відкрити журнал', icon: FactCheckIcon, alert: false },
    )
  }
  if (notes) {
    notes.groups.forEach((group) => {
      rows.push({
        key: `notes-${group.id}`,
        to: `/notes?groupId=${group.id}`,
        title: `Нотатки не заповнено: ${group.name}, ${childrenCount(group.pending)}`,
        meta: group.overdue ? 'прострочено' : 'Очікують заповнення',
        action: 'Заповнити',
        cta: 'Заповнити нотатки',
        icon: EditNoteIcon,
        alert: true,
      })
    })
  }
  if (tasks) {
    tasks.mine.forEach((task) => {
      rows.push({
        key: `task-mine-${task.id}`,
        to: '/tasks?tab=mine',
        title: task.overdue ? `Прострочено: ${task.title}` : `Сьогодні до ${task.dueTime}: ${task.title}`,
        meta: task.overdue ? 'прострочено' : 'Очікує виконання',
        action: 'Відкрити',
        cta: 'Відкрити завдання',
        icon: AssignmentIcon,
        alert: true,
      })
    })
    tasks.given.forEach((task) => {
      const names = task.notDone.slice(0, 3).map((user) => `${user.firstName} ${user.lastName}`).join(', ')
      const more = task.notDone.length - 3
      rows.push({
        key: `task-given-${task.id}`,
        to: '/tasks?tab=given',
        title: `Не виконали: ${task.title}, ${task.total - task.done} з ${task.total}`,
        meta: more > 0 ? `${names} ще ${more}` : names,
        action: 'Переглянути',
        cta: 'Відкрити завдання',
        icon: AssignmentIcon,
        alert: true,
      })
    })
  }
  if (notices) {
    rows.push(
      notices.count > 0
        ? { key: 'notices', to: '/absence-notices', title: `Заяви на відсутність: ${notices.count}`, meta: 'Очікують на розгляд', action: 'Переглянути', cta: 'Переглянути заяви', icon: MarkEmailUnreadIcon, alert: true }
        : { key: 'notices', to: '/absence-notices', title: 'Заяви на відсутність', meta: 'Нових заяв немає', action: 'Відкрити', cta: 'Переглянути заяви', icon: MarkEmailUnreadIcon, alert: false },
    )
  }
  if (debts) {
    rows.push(
      debts.children > 0
        ? { key: 'debts', to: '/finance', title: `Прострочені борги: ${formatMoney(debts.amount)}`, meta: `Дітей: ${debts.children}`, action: 'Переглянути', cta: 'Переглянути борги', icon: MoneyOffIcon, alert: true }
        : { key: 'debts', to: '/finance', title: 'Прострочені борги', meta: 'Прострочених боргів немає', action: 'Відкрити', cta: 'Відкрити фінанси', icon: MoneyOffIcon, alert: false },
    )
  }
  if (onlinePending) {
    rows.push({ key: 'onlinePending', to: '/finance', title: `Онлайн-оплати очікують: ${onlinePending.count}`, meta: 'Рахунки довго чекають відповіді банку', action: 'Переглянути', cta: 'Відкрити фінанси', icon: HourglassEmptyIcon, alert: true })
  }
  if (payroll) {
    rows.push(
      payroll.count > 0
        ? { key: 'payroll', to: '/payroll', title: `Зарплати за ${payroll.month}: ${payroll.count}`, meta: namesLine(payroll.names, payroll.more), action: 'Відкрити', cta: 'Відкрити зарплати', icon: RequestQuoteIcon, alert: true }
        : { key: 'payroll', to: '/payroll', title: `Зарплати за ${payroll.month}`, meta: 'Усі відомості затверджені', action: 'Відкрити', cta: 'Відкрити зарплати', icon: RequestQuoteIcon, alert: false },
    )
  }
  if (backups) {
    rows.push({
      key: 'backups',
      to: '/backups',
      title: 'Резервні копії',
      meta: backups.configured ? 'Остання резервна копія невдала або застаріла' : 'Резервні копії не налаштовані',
      action: 'Відкрити',
      cta: 'Відкрити резервні копії',
      icon: BackupIcon,
      alert: true,
    })
  }
  return [...rows.filter((row) => row.alert), ...rows.filter((row) => !row.alert)]
}

interface HeroProps {
  date: string
  firstName: string
  count: number
  first?: AttentionRow
}

const Hero = ({ date, firstName, count, first }: HeroProps) => (
  <Box
    sx={{
      position: 'relative',
      overflow: 'hidden',
      bgcolor: brandColors.olive,
      color: brandColors.inkOnOlive,
      borderRadius: '28px',
      pl: { xs: 3, sm: 5 },
      pr: { xs: 3, sm: 5, md: '290px' },
      minHeight: { md: 290 },
      boxSizing: 'border-box',
      py: { xs: 3, sm: 4.5 },
      mb: 4,
    }}
  >
    <Typography sx={{ fontWeight: 700, color: brandColors.inkOnOliveSoft, mb: 1 }}>{dateLine(date)}</Typography>
    <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 40 }, fontWeight: 900, lineHeight: 1.15, mb: 1 }}>
      {firstName ? `${greeting()}, ${firstName}.` : `${greeting()}.`}
    </Typography>
    <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 600, color: brandColors.inkOnOliveSoft }}>
      {tasksLine(count)}
    </Typography>
    {first && (
      <Button component={RouterLink} to={first.to} variant="contained" disableElevation sx={{ mt: 3 }}>
        {first.cta}
      </Button>
    )}
    <Box
      component="img"
      src={mascotUrl}
      alt=""
      sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: 32, bottom: 0, width: 230 }}
    />
  </Box>
)

const Row = ({ row }: { row: AttentionRow }) => {
  const Icon = row.icon
  return (
    <ButtonBase
      component={RouterLink}
      to={row.to}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 2,
        px: { xs: 2, sm: 3 },
        py: 2,
        textAlign: 'left',
        '&:not(:last-of-type)': { borderBottom: `1px solid ${brandColors.hairline}` },
        '&:hover': { bgcolor: brandColors.hoverRow },
        '&.Mui-focusVisible': { outline: `2px solid ${brandColors.orange}`, outlineOffset: -2 },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: row.alert ? brandColors.orangeTint : brandColors.oliveTint,
          color: row.alert ? brandColors.orangeText : brandColors.inkOnOliveSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800 }}>{row.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {row.meta}
        </Typography>
      </Box>
      <Typography
        sx={{
          display: { xs: 'none', sm: 'block' },
          flexShrink: 0,
          fontSize: 14,
          fontWeight: 800,
          color: row.alert ? brandColors.orangeText : 'text.secondary',
        }}
      >
        {row.action}
      </Typography>
    </ButtonBase>
  )
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900, mb: 1.5 }}>
    {children}
  </Typography>
)

const Breakdown = ({ children }: { children: string }) => (
  <Typography variant="body2" color="text.secondary">
    {children}
  </Typography>
)

export const DashboardPage = () => {
  const canViewMeals = useCan('meals', 'view')
  const firstName = useAuthStore((s) => s.profile?.firstName ?? '')
  const [data, setData] = useState<TodayDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFailed, setIsFailed] = useState(false)

  const load = useCallback(() => {
    dashboardApi
      .today()
      .then((result) => {
        setData(result)
        setIsFailed(false)
      })
      .catch(() => setIsFailed(true))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const retry = () => {
    setIsLoading(true)
    load()
  }

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: '28px', mb: 4 }} />
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: '20px' }} />
      </Box>
    )
  }

  if (isFailed || !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            Спробувати ще
          </Button>
        }
      >
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  const rows = buildRows(data)
  const alertRows = rows.filter((row) => row.alert)
  const { meals, payments } = data

  return (
    <Box>
      <Hero date={data.date} firstName={firstName} count={alertRows.length} first={alertRows[0]} />

      {rows.length === 0 && !meals && !payments && (
        <Typography color="text.secondary">Для вас поки немає карток</Typography>
      )}

      {rows.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>Потребує уваги</SectionTitle>
          <Paper elevation={0} sx={{ borderRadius: '20px', boxShadow: brandColors.outline, overflow: 'hidden' }}>
            {rows.map((row) => (
              <Row key={row.key} row={row} />
            ))}
          </Paper>
        </Box>
      )}

      {(payments || meals) && (
        <Grid container spacing={2.5}>
          {payments && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <DashboardCard to="/reports" title="Оплати сьогодні" icon={PaymentsIcon} value={formatMoney(payments.total)}>
                {methodOrder.map((method) => (
                  <Breakdown key={method}>{`${methodLabels[method]}: ${formatMoney(payments.byMethod[method])}`}</Breakdown>
                ))}
              </DashboardCard>
            </Grid>
          )}
          {meals && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <DashboardCard to={canViewMeals ? '/meals' : '/register'} title="Обіди сьогодні" icon={RestaurantIcon} value={String(meals.count)}>
                {meals.groups.map((group) => (
                  <Breakdown key={group.name}>{`${group.name}: ${group.count}`}</Breakdown>
                ))}
              </DashboardCard>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  )
}
