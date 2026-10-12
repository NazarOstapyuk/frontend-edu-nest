import { Fragment, useState } from 'react'
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  chargeStateLabels,
  financeCategoryLabels,
  formatDay,
  formatMoney,
  paymentMethodLabels,
  type CabinetFinance,
  type CabinetPayment,
} from '../../../shared/api'

const stateColor = { paid: 'success', partial: 'warning', unpaid: 'error' } as const

const period = (start: string | null, end: string | null) => {
  if (!start) return '—'
  return end && end !== start ? `${formatDay(start)} – ${formatDay(end)}` : formatDay(start)
}

const PaymentRow = ({ payment }: { payment: CabinetPayment }) => {
  const [open, setOpen] = useState(false)
  return (
    <Fragment>
      <TableRow>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" aria-label="Розподіл оплати" onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{formatDay(payment.receivedAt)}</TableCell>
        <TableCell align="right">{formatMoney(payment.amount)}</TableCell>
        <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
        <TableCell>{payment.category ? financeCategoryLabels[payment.category] : 'Будь-що'}</TableCell>
        <TableCell align="right">{formatMoney(payment.free)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ py: 1 }}>
              {payment.allocations.length === 0 && <Typography variant="body2" color="text.secondary">Ще не розподілено</Typography>}
              {payment.allocations.map((a) => (
                <Typography key={a.chargeId} variant="body2">{a.description}: {formatMoney(a.amount)} грн</Typography>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

export const ChildFinanceTab = ({ finance }: { finance: CabinetFinance }) => {
  const active = finance.summary.filter((s) => Number(s.due) > 0 || Number(s.prepayment) > 0)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(220px, 1fr))' } }}>
        {active.map((s) => (
          <Paper key={s.category} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>{financeCategoryLabels[s.category]}</Typography>
            <Typography color={Number(s.due) > 0 ? 'error.main' : 'text.primary'}>До оплати: {formatMoney(s.due)} грн</Typography>
            {Number(s.overdue) > 0 && <Typography variant="body2" color="error.main">Прострочено: {formatMoney(s.overdue)} грн</Typography>}
            {Number(s.prepayment) > 0 && <Typography variant="body2" color="text.secondary">Передоплата: {formatMoney(s.prepayment)} грн</Typography>}
          </Paper>
        ))}
        {Number(finance.unallocated) > 0 && (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>Аванс без призначення</Typography>
            <Typography>{formatMoney(finance.unallocated)} грн</Typography>
          </Paper>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Typography sx={{ fontWeight: 700, p: 2 }}>Нарахування</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>За що</TableCell>
              <TableCell>Період</TableCell>
              <TableCell align="right">Сума</TableCell>
              <TableCell align="right">Сплачено</TableCell>
              <TableCell align="right">Залишок</TableCell>
              <TableCell>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {finance.charges.length === 0 ? (
              <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary' }}>Нарахувань немає.</TableCell></TableRow>
            ) : (
              finance.charges.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.description}</TableCell>
                  <TableCell>{period(c.periodStart, c.periodEnd)}</TableCell>
                  <TableCell align="right">{formatMoney(c.amount)}</TableCell>
                  <TableCell align="right">{formatMoney(c.paid)}</TableCell>
                  <TableCell align="right">{formatMoney(c.remaining)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip size="small" color={stateColor[c.state]} variant="outlined" label={chargeStateLabels[c.state]} />
                      {c.overdue && <Chip size="small" color="error" label="Прострочено" />}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Typography sx={{ fontWeight: 700, p: 2 }}>Оплати</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Дата</TableCell>
              <TableCell align="right">Сума</TableCell>
              <TableCell>Спосіб</TableCell>
              <TableCell>Призначення</TableCell>
              <TableCell align="right">Не розподілено</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {finance.payments.length === 0 ? (
              <TableRow><TableCell colSpan={6} sx={{ color: 'text.secondary' }}>Оплат немає.</TableCell></TableRow>
            ) : (
              finance.payments.map((p) => <PaymentRow key={p.id} payment={p} />)
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
