import {
  Chip,
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
import { useChildFinanceStore } from '../model/childFinanceStore'
import {
  chargeStateLabels,
  financeCategoryLabels,
  formatMoney,
  type ChargeState,
  type FinanceCharge,
} from '../../../shared/api'

const stateColors: Record<ChargeState, 'error' | 'warning' | 'success'> = {
  unpaid: 'error',
  partial: 'warning',
  paid: 'success',
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA')

const formatPeriod = (charge: FinanceCharge) => {
  if (!charge.periodStart) return formatDate(charge.createdAt)
  return charge.periodEnd
    ? `${formatDate(charge.periodStart)} – ${formatDate(charge.periodEnd)}`
    : formatDate(charge.periodStart)
}

interface ChargesTableProps {
  charges: FinanceCharge[]
}

export const ChargesTable = ({ charges }: ChargesTableProps) => {
  const setVoidModal = useChildFinanceStore((s) => s.setVoidModal)

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
            <TableCell>Період / дата</TableCell>
            <TableCell>Категорія</TableCell>
            <TableCell>Опис</TableCell>
            <TableCell align="right">Сума</TableCell>
            <TableCell align="right">Сплачено</TableCell>
            <TableCell>Стан</TableCell>
            <TableCell align="right">Дії</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {charges.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                Нарахувань ще немає.
              </TableCell>
            </TableRow>
          ) : (
            charges.map((charge) => {
              const voided = Boolean(charge.voidedAt)
              return (
                <TableRow
                  key={charge.id}
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    ...(voided && { '& td': { color: 'text.disabled', textDecoration: 'line-through' } }),
                  }}
                >
                  <TableCell>{formatPeriod(charge)}</TableCell>
                  <TableCell>{financeCategoryLabels[charge.category]}</TableCell>
                  <TableCell>
                    {voided ? (
                      <Tooltip title={`Причина сторно: ${charge.voidReason ?? ''}`}>
                        <Typography variant="body2" component="span">{charge.description}</Typography>
                      </Tooltip>
                    ) : (
                      charge.description
                    )}
                  </TableCell>
                  <TableCell align="right">{formatMoney(charge.amount)}</TableCell>
                  <TableCell align="right">{formatMoney(charge.paid)}</TableCell>
                  <TableCell>
                    {voided ? (
                      <Chip label="Сторновано" size="small" />
                    ) : (
                      <Chip
                        label={chargeStateLabels[charge.state]}
                        size="small"
                        color={stateColors[charge.state]}
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!voided && (
                      <Tooltip title="Сторнувати">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setVoidModal({
                              isOpen: true,
                              target: { kind: 'charge', id: charge.id, title: charge.description },
                            })
                          }
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
