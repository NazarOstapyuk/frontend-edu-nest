import { Fragment, useEffect, useState } from 'react'
import {
  Box,
  Button,
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
  financeCategoryLabels,
  formatMoney,
  invoiceStatusLabels,
  linkStateLabels,
  onlinePaymentsApi,
  requestSourceLabels,
  type PaymentRequestView,
} from '../../../shared/api'
import { useCan } from '../../../entities/user'

const formatDateTime = (value: string) => new Date(value).toLocaleString('uk-UA')

const RequestRow = ({ request, onCancel }: { request: PaymentRequestView; onCancel: (id: string) => void }) => {
  const [open, setOpen] = useState(false)
  const canEdit = useCan('finance', 'edit')
  const author = request.createdBy ? `${request.createdBy.lastName} ${request.createdBy.firstName}` : '—'

  return (
    <Fragment>
      <TableRow>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" aria-label="Спроби оплати" onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{formatDateTime(request.createdAt)}</TableCell>
        <TableCell>{financeCategoryLabels[request.category]}</TableCell>
        <TableCell align="right">{formatMoney(request.amount)}</TableCell>
        <TableCell>{requestSourceLabels[request.source]}</TableCell>
        <TableCell>
          <Chip
            size="small"
            variant="outlined"
            color={request.status === 'paid' ? 'success' : request.status === 'open' ? 'warning' : 'default'}
            label={linkStateLabels[request.status]}
          />
        </TableCell>
        <TableCell>{author}</TableCell>
        <TableCell align="right">
          {canEdit && request.status === 'open' && (
            <Button size="small" color="error" onClick={() => onCancel(request.id)}>Скасувати</Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ py: 1 }}>
              {request.invoices.length === 0 && (
                <Typography variant="body2" color="text.secondary">Спроб оплати ще не було</Typography>
              )}
              {request.invoices.map((invoice) => (
                <Typography key={invoice.id} variant="body2">
                  {formatDateTime(invoice.createdAt)}: {invoiceStatusLabels[invoice.status]}, {formatMoney(invoice.amount)}
                  {invoice.failureReason ? `, причина: ${invoice.failureReason}` : ''}
                </Typography>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

export const OnlinePaymentsTab = ({ childId }: { childId: string }) => {
  const [requests, setRequests] = useState<PaymentRequestView[] | null>(null)

  useEffect(() => {
    onlinePaymentsApi
      .requests(childId)
      .then(({ data }) => setRequests(data))
      .catch(() => setRequests([]))
  }, [childId])

  const cancel = async (id: string) => {
    try {
      const { data } = await onlinePaymentsApi.cancel(id)
      setRequests((prev) => prev?.map((r) => (r.id === id ? data : r)) ?? prev)
    } catch {
      return
    }
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Дата</TableCell>
            <TableCell>Категорія</TableCell>
            <TableCell align="right">Сума</TableCell>
            <TableCell>Джерело</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Хто створив</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {requests === null ? (
            <TableRow><TableCell colSpan={8} sx={{ color: 'text.secondary' }}>Завантаження…</TableCell></TableRow>
          ) : requests.length === 0 ? (
            <TableRow><TableCell colSpan={8} sx={{ color: 'text.secondary' }}>Онлайн-оплат немає.</TableCell></TableRow>
          ) : (
            requests.map((r) => <RequestRow key={r.id} request={r} onCancel={cancel} />)
          )}
        </TableBody>
      </Table>
    </Paper>
  )
}
