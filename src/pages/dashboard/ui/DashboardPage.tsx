import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Grid, Skeleton, Typography } from '@mui/material'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import MoneyOffIcon from '@mui/icons-material/MoneyOff'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import PaymentsIcon from '@mui/icons-material/Payments'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import BackupIcon from '@mui/icons-material/Backup'
import { dashboardApi, formatMoney } from '../../../shared/api'
import type { DashboardPaymentMethod, TodayDashboard } from '../../../shared/api'
import { DashboardCard } from './DashboardCard'

const methodLabels: Record<DashboardPaymentMethod, string> = {
  cash: 'Готівка',
  bank_transfer: 'Переказ',
  card: 'Картка',
  online: 'Онлайн',
}

const methodOrder: DashboardPaymentMethod[] = ['cash', 'bank_transfer', 'card', 'online']

const namesLine = (names: string[], more: number) =>
  names.join(', ') + (more > 0 ? ` і ще ${more}` : '')

const Detail = ({ children }: { children: string }) => (
  <Typography variant="body2" color="text.secondary">
    {children}
  </Typography>
)

const Value = ({ children }: { children: string }) => (
  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
    {children}
  </Typography>
)

const Calm = ({ children }: { children: string }) => (
  <Typography variant="body1" sx={{ fontWeight: 600 }}>
    {children}
  </Typography>
)

const hasCards = (data: TodayDashboard) => Object.keys(data).some((key) => key !== 'date')

export const DashboardPage = () => {
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
      <Grid container spacing={2.5}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Skeleton variant="rounded" height={96} />
          </Grid>
        ))}
      </Grid>
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

  if (!hasCards(data)) {
    return <Typography color="text.secondary">Для вас поки немає карток</Typography>
  }

  const { register, notices, debts, meals, payments, onlinePending, payroll, backups } = data

  return (
    <Box>
      <Grid container spacing={2.5}>
        {register && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/register" title="Журнал не відмічено" icon={FactCheckIcon} alert={register.count > 0}>
              {register.count > 0 ? (
                <>
                  <Value>{String(register.count)}</Value>
                  <Detail>{namesLine(register.names, register.more)}</Detail>
                </>
              ) : (
                <Calm>Усі групи відмічено</Calm>
              )}
            </DashboardCard>
          </Grid>
        )}
        {notices && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/absence-notices" title="Заяви на відсутність" icon={MarkEmailUnreadIcon} alert={notices.count > 0}>
              {notices.count > 0 ? <Value>{String(notices.count)}</Value> : <Calm>Нових заяв немає</Calm>}
            </DashboardCard>
          </Grid>
        )}
        {debts && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/finance" title="Прострочені борги" icon={MoneyOffIcon} alert={debts.children > 0}>
              {debts.children > 0 ? (
                <>
                  <Value>{`${formatMoney(debts.amount)} грн`}</Value>
                  <Detail>{`Дітей: ${debts.children}`}</Detail>
                </>
              ) : (
                <Calm>Прострочених боргів немає</Calm>
              )}
            </DashboardCard>
          </Grid>
        )}
        {meals && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/meals" title="Обіди сьогодні" icon={RestaurantIcon} alert={false}>
              <Value>{String(meals.count)}</Value>
              {meals.groups.map((group) => (
                <Detail key={group.name}>{`${group.name}: ${group.count}`}</Detail>
              ))}
            </DashboardCard>
          </Grid>
        )}
        {payments && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/reports" title="Оплати сьогодні" icon={PaymentsIcon} alert={false}>
              <Value>{`${formatMoney(payments.total)} грн`}</Value>
              {methodOrder.map((method) => (
                <Detail key={method}>{`${methodLabels[method]}: ${formatMoney(payments.byMethod[method])} грн`}</Detail>
              ))}
            </DashboardCard>
          </Grid>
        )}
        {onlinePending && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/finance" title="Онлайн-оплати очікують" icon={HourglassEmptyIcon} alert>
              <Value>{String(onlinePending.count)}</Value>
            </DashboardCard>
          </Grid>
        )}
        {payroll && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/payroll" title={`Зарплати за ${payroll.month}`} icon={RequestQuoteIcon} alert={payroll.count > 0}>
              {payroll.count > 0 ? (
                <>
                  <Value>{String(payroll.count)}</Value>
                  <Detail>{namesLine(payroll.names, payroll.more)}</Detail>
                </>
              ) : (
                <Calm>Усі відомості затверджені</Calm>
              )}
            </DashboardCard>
          </Grid>
        )}
        {backups && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DashboardCard to="/backups" title="Резервні копії" icon={BackupIcon} alert>
              <Calm>
                {backups.configured ? 'Остання резервна копія невдала або застаріла' : 'Резервні копії не налаштовані'}
              </Calm>
            </DashboardCard>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
