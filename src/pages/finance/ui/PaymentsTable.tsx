import { useState } from 'react'
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useChildFinanceStore } from '../model/childFinanceStore'
import {
  financeCategoryLabels,
  formatMoney,
  paymentMethodLabels,
  type FinancePayment,
} from '../../../shared/api'

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA')
const voidedSx = { '& td': { color: 'text.disabled', textDecoration: 'line-through' } }

const PaymentRow = ({ payment }: { payment: FinancePayment }) => {
  const [open, setOpen] = useState(false)
  const setVoidModal = useChildFinanceStore((s) => s.setVoidModal)
  const setAllocateModal = useChildFinanceStore((s) => s.setAllocateModal)
  const voided = Boolean(payment.voidedAt)

  return (
    <>
      <TableRow sx={voided ? voidedSx : undefined}>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{formatDate(payment.receivedAt)}</TableCell>
        <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
        <TableCell>
          {voided ? (
            <Tooltip title={`Причина сторно: ${payment.voidReason ?? ''}`}>
              <Typography variant="body2" component="span">{payment.reference}</Typography>
            </Tooltip>
          ) : (
            payment.reference
          )}
        </TableCell>
        <TableCell>{payment.category ? financeCategoryLabels[payment.category] : 'Без категорії'}</TableCell>
        <TableCell align="right">{formatMoney(payment.amount)}</TableCell>
        <TableCell align="right">{formatMoney(payment.allocated)}</TableCell>
        <TableCell>
          {payment.createdBy ? `${payment.createdBy.lastName} ${payment.createdBy.firstName}` : '—'}
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {!voided && Number(payment.free) > 0 && (
            <Tooltip title="Розподілити">
              <IconButton
                size="small"
                color="primary"
                onClick={() => setAllocateModal({ isOpen: true, payment })}
              >
                <CallSplitIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!voided && (
            <Tooltip title="Сторнувати">
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  setVoidModal({
                    isOpen: true,
                    target: { kind: 'payment', id: payment.id, title: payment.reference },
                  })
                }
              >
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ py: 2 }}>
              {payment.note && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Примітка: {payment.note}
                </Typography>
              )}
              {payment.allocations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Не розподілено. Вільна сума: {formatMoney(payment.free)}
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Нарахування</TableCell>
                      <TableCell align="right">Сума</TableCell>
                      <TableCell>Дата</TableCell>
                      <TableCell>Хто</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payment.allocations.map((a) => (
                      <TableRow key={a.id} sx={a.voidedAt ? voidedSx : undefined}>
                        <TableCell>
                          {a.voidedAt ? (
                            <Tooltip title={`Причина: ${a.voidReason ?? ''}`}>
                              <Typography variant="body2" component="span">{a.charge.description}</Typography>
                            </Tooltip>
                          ) : (
                            a.charge.description
                          )}
                        </TableCell>
                        <TableCell align="right">{formatMoney(a.amount)}</TableCell>
                        <TableCell>{formatDate(a.createdAt)}</TableCell>
                        <TableCell>{`${a.createdBy.lastName} ${a.createdBy.firstName}`}</TableCell>
                        <TableCell align="right">
                          {!a.voidedAt && !voided && (
                            <Tooltip title="Зняти розподіл">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  setVoidModal({
                                    isOpen: true,
                                    target: {
                                      kind: 'allocation',
                                      id: a.id,
                                      title: `${payment.reference} → ${a.charge.description}`,
                                    },
                                  })
                                }
                              >
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

interface PaymentsTableProps {
  payments: FinancePayment[]
}

export const PaymentsTable = ({ payments }: PaymentsTableProps) => (
  <TableContainer
    component={Paper}
    elevation={0}
    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
  >
    <Table>
      <TableHead>
        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
          <TableCell />
          <TableCell>Дата</TableCell>
          <TableCell>Спосіб</TableCell>
          <TableCell>Реквізит</TableCell>
          <TableCell>Категорія</TableCell>
          <TableCell align="right">Сума</TableCell>
          <TableCell align="right">Розподілено</TableCell>
          <TableCell>Вніс</TableCell>
          <TableCell align="right">Дії</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
              Оплат ще немає.
            </TableCell>
          </TableRow>
        ) : (
          payments.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
        )}
      </TableBody>
    </Table>
  </TableContainer>
)
