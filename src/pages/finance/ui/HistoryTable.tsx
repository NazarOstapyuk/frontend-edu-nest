import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { financeEventLabels, formatMoney, type FinanceEvent } from '../../../shared/api'

interface HistoryTableProps {
  events: FinanceEvent[]
}

export const HistoryTable = ({ events }: HistoryTableProps) => {
  const isPhone = useIsPhone()

  if (isPhone) {
    return (
      <CardList
        items={events}
        getKey={(e) => `${e.type}-${e.at}-${events.indexOf(e)}`}
        empty={
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Подій ще немає.
          </Typography>
        }
        renderCard={(event) => (
          <>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{financeEventLabels[event.type]}</Typography>
            <CardField label="Дата і час">{new Date(event.at).toLocaleString('uk-UA')}</CardField>
            <CardField label="Опис">{event.description}</CardField>
            <CardField label="Сума">{formatMoney(event.amount)}</CardField>
            <CardField label="Хто">{event.by ? `${event.by.lastName} ${event.by.firstName}` : '—'}</CardField>
            {event.reason && <CardField label="Причина">{event.reason}</CardField>}
          </>
        )}
      />
    )
  }

  return (
  <TableContainer
    component={Paper}
    elevation={0}
    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
  >
    <Table>
      <TableHead>
        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
          <TableCell>Дата і час</TableCell>
          <TableCell>Подія</TableCell>
          <TableCell>Опис</TableCell>
          <TableCell align="right">Сума</TableCell>
          <TableCell>Хто</TableCell>
          <TableCell>Причина</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {events.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
              Подій ще немає.
            </TableCell>
          </TableRow>
        ) : (
          events.map((event, index) => (
            <TableRow key={`${event.type}-${event.at}-${index}`} sx={{ '&:last-child td': { borderBottom: 0 } }}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(event.at).toLocaleString('uk-UA')}</TableCell>
              <TableCell>{financeEventLabels[event.type]}</TableCell>
              <TableCell>{event.description}</TableCell>
              <TableCell align="right">{formatMoney(event.amount)}</TableCell>
              <TableCell>{event.by ? `${event.by.lastName} ${event.by.firstName}` : '—'}</TableCell>
              <TableCell>{event.reason ?? '—'}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
  )
}
