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
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
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
  const canEdit = useCan('finance', 'edit')
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
              <Typography variant="body2" component="span">{payment.reference || '—'}</Typography>
            </Tooltip>
          ) : (
            payment.reference || '—'
          )}
        </TableCell>
        <TableCell>{payment.category ? financeCategoryLabels[payment.category] : 'Без категорії'}</TableCell>
        <TableCell align="right">{formatMoney(payment.amount)}</TableCell>
        <TableCell align="right">{formatMoney(payment.allocated)}</TableCell>
        <TableCell>
          {payment.createdBy ? `${payment.createdBy.lastName} ${payment.createdBy.firstName}` : '—'}
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {canEdit && !voided && Number(payment.free) > 0 && (
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
          {canEdit && !voided && (
            <Tooltip title="Сторнувати">
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  setVoidModal({
                    isOpen: true,
                    target: { kind: 'payment', id: payment.id, title: payment.reference || 'Оплата' },
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
                          {canEdit && !a.voidedAt && !voided && (
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
                                      title: `${payment.reference || 'Оплата'} → ${a.charge.description}`,
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

const PaymentCard = ({ payment }: { payment: FinancePayment }) => {
  const [open, setOpen] = useState(false)
  const setVoidModal = useChildFinanceStore((s) => s.setVoidModal)
  const setAllocateModal = useChildFinanceStore((s) => s.setAllocateModal)
  const canEdit = useCan('finance', 'edit')
  const voided = Boolean(payment.voidedAt)

  return (
    <Box sx={voided ? { color: 'text.disabled' } : undefined}>
      <Typography sx={{ fontWeight: 600, mb: 0.5, textDecoration: voided ? 'line-through' : undefined }}>
        {payment.reference || 'Оплата'}
      </Typography>
      <CardField label="Дата">{formatDate(payment.receivedAt)}</CardField>
      <CardField label="Спосіб">{paymentMethodLabels[payment.method]}</CardField>
      <CardField label="Категорія">
        {payment.category ? financeCategoryLabels[payment.category] : 'Без категорії'}
      </CardField>
      <CardField label="Сума">{formatMoney(payment.amount)}</CardField>
      <CardField label="Розподілено">{formatMoney(payment.allocated)}</CardField>
      <CardField label="Вніс">
        {payment.createdBy ? `${payment.createdBy.lastName} ${payment.createdBy.firstName}` : '—'}
      </CardField>
      {voided && <CardField label="Причина сторно">{payment.voidReason ?? '—'}</CardField>}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pt: 1 }}>
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
            payment.allocations.map((a) => (
              <Box
                key={a.id}
                sx={{
                  py: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  ...(a.voidedAt && { color: 'text.disabled', textDecoration: 'line-through' }),
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {a.charge.description}
                </Typography>
                <CardField label="Сума">{formatMoney(a.amount)}</CardField>
                <CardField label="Дата">{formatDate(a.createdAt)}</CardField>
                <CardField label="Хто">{`${a.createdBy.lastName} ${a.createdBy.firstName}`}</CardField>
                {a.voidedAt && <CardField label="Причина">{a.voidReason ?? '—'}</CardField>}
                {canEdit && !a.voidedAt && !voided && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
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
                              title: `${payment.reference || 'Оплата'} → ${a.charge.description}`,
                            },
                          })
                        }
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      </Collapse>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
        <IconButton size="small" onClick={() => setOpen(!open)}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
        {canEdit && !voided && Number(payment.free) > 0 && (
          <Tooltip title="Розподілити">
            <IconButton size="small" color="primary" onClick={() => setAllocateModal({ isOpen: true, payment })}>
              <CallSplitIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {canEdit && !voided && (
          <Tooltip title="Сторнувати">
            <IconButton
              size="small"
              color="error"
              onClick={() =>
                setVoidModal({
                  isOpen: true,
                  target: { kind: 'payment', id: payment.id, title: payment.reference || 'Оплата' },
                })
              }
            >
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

interface PaymentsTableProps {
  payments: FinancePayment[]
}

export const PaymentsTable = ({ payments }: PaymentsTableProps) => {
  const isPhone = useIsPhone()

  if (isPhone) {
    return (
      <CardList
        items={payments}
        getKey={(p) => p.id}
        empty={
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Оплат ще немає.
          </Typography>
        }
        renderCard={(payment) => <PaymentCard payment={payment} />}
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
}
