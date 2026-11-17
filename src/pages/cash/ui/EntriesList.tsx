import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  cashDirectionLabels,
  cashEntryKindLabels,
  cashExpenseCategoryLabels,
  cashTransferStatusLabels,
  financeCategoryLabels,
  toKopecks,
  type CashEntryView,
  type CashTransferStatus,
} from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import { formatDateTime } from '../../../shared/lib/date'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'
import { signedKopecks } from '../model/cashFormat'

const transferColors: Record<CashTransferStatus, { bg: string; color: string }> = {
  pending: { bg: brandColors.partialBg, color: brandColors.partialText },
  confirmed: { bg: brandColors.paidBg, color: brandColors.paidText },
  disputed: { bg: brandColors.unpaidBg, color: brandColors.unpaidText },
}

const entrySign = (entry: CashEntryView) => {
  if (entry.kind === 'income') return 1
  if (entry.kind === 'correction') return entry.sign < 0 ? -1 : 1
  return -1
}

const canVoid = (entry: CashEntryView) =>
  !entry.voidedAt &&
  (entry.kind === 'expense' || (entry.kind === 'transfer' && entry.transfer?.status !== 'confirmed'))

const Amount = ({ entry }: { entry: CashEntryView }) => {
  const kopecks = toKopecks(entry.amount) * entrySign(entry)
  const voided = !!entry.voidedAt
  return (
    <Typography
      component="span"
      sx={{
        fontWeight: 800,
        whiteSpace: 'nowrap',
        color: voided ? 'text.secondary' : kopecks < 0 ? brandColors.debt : brandColors.paidText,
        textDecoration: voided ? 'line-through' : 'none',
      }}
    >
      {signedKopecks(kopecks)}
    </Typography>
  )
}

const Details = ({ entry }: { entry: CashEntryView }) => {
  const lines: ReactNode[] = []
  if (entry.payment) {
    lines.push(
      <Link key="child" component={RouterLink} to={`/finance/${entry.payment.child.id}`} sx={{ fontWeight: 700 }}>
        {entry.payment.child.name}
      </Link>,
    )
    const meta = [
      entry.payment.payerName ? `Платник: ${entry.payment.payerName}` : null,
      entry.payment.category ? financeCategoryLabels[entry.payment.category] : null,
    ].filter(Boolean)
    if (meta.length > 0) lines.push(<Typography key="meta" variant="body2" color="text.secondary">{meta.join(' · ')}</Typography>)
  }
  if (entry.expenseCategory) {
    lines.push(<Typography key="category" variant="body2" sx={{ fontWeight: 700 }}>{cashExpenseCategoryLabels[entry.expenseCategory]}</Typography>)
  }
  if (entry.transfer) {
    const status = entry.transfer.status
    lines.push(
      <Box key="transfer" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>Кому: {entry.transfer.recipient.name}</Typography>
        {status && (
          <Chip
            size="small"
            label={cashTransferStatusLabels[status]}
            sx={{ bgcolor: transferColors[status].bg, color: transferColors[status].color }}
          />
        )}
      </Box>,
    )
    if (entry.transfer.note) {
      lines.push(<Typography key="note" variant="body2" color="text.secondary">Отримувач: {entry.transfer.note}</Typography>)
    }
  }
  if (entry.comment) {
    lines.push(<Typography key="comment" variant="body2" color="text.secondary">{entry.comment}</Typography>)
  }
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={entry.voidedAt ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>
        {lines.length > 0 ? lines : <Typography variant="body2" color="text.secondary">—</Typography>}
      </Box>
      {entry.voidedAt && (
        <Typography variant="body2" sx={{ color: brandColors.debt, fontWeight: 700 }}>
          Скасовано{entry.voidedBy ? ` (${entry.voidedBy.name})` : ''}: {entry.voidReason}
        </Typography>
      )}
    </Box>
  )
}

interface EntriesListProps {
  entries: CashEntryView[]
  canEdit: boolean
  onVoid: (entry: CashEntryView) => void
}

export const EntriesList = ({ entries, canEdit, onVoid }: EntriesListProps) => {
  const isPhone = useIsPhone()
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const empty = 'За цю зміну ще немає операцій'
  const voidButton = (entry: CashEntryView) =>
    canEdit && canVoid(entry) ? (
      <Button size="small" color="inherit" onClick={() => onVoid(entry)}>
        Скасувати
      </Button>
    ) : null

  return (
    <Box>
      <Typography component="h3" sx={{ fontSize: 18, fontWeight: 900, mb: 1.5 }}>
        Операції зміни{sorted.length > 0 ? `: ${sorted.length}` : ''}
      </Typography>
      {isPhone ? (
        <CardList
          items={sorted}
          getKey={(entry) => entry.id}
          empty={<Typography color="text.secondary">{empty}</Typography>}
          renderCard={(entry) => {
            const action = voidButton(entry)
            return (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <Typography sx={{ fontWeight: 800 }}>{cashEntryKindLabels[entry.kind]}</Typography>
                  <Amount entry={entry} />
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Details entry={entry} />
                </Box>
                <CardField label="Час">{formatDateTime(entry.createdAt)}</CardField>
                <CardField label="Напрям">{cashDirectionLabels[entry.direction]}</CardField>
                <CardField label="Хто">{entry.createdBy.name}</CardField>
                {action && <Box sx={{ mt: 1 }}>{action}</Box>}
              </>
            )
          }}
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' } }}>
                <TableCell>Час</TableCell>
                <TableCell>Вид</TableCell>
                <TableCell>Напрям</TableCell>
                <TableCell>Деталі</TableCell>
                <TableCell align="right">Сума</TableCell>
                <TableCell>Хто</TableCell>
                {canEdit && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} sx={{ color: 'text.secondary' }}>
                    {empty}
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((entry) => (
                  <TableRow key={entry.id} sx={entry.voidedAt ? { bgcolor: brandColors.hoverRow } : undefined}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(entry.createdAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{cashEntryKindLabels[entry.kind]}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{cashDirectionLabels[entry.direction]}</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Details entry={entry} />
                    </TableCell>
                    <TableCell align="right">
                      <Amount entry={entry} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.createdBy.name}</TableCell>
                    {canEdit && <TableCell align="right">{voidButton(entry)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  )
}
