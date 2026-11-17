import type { ReactNode } from 'react'
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined'
import {
  cashDirectionLabels,
  formatMoney,
  toKopecks,
  type CashDeskState,
  type CashDirection,
} from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import { formatDateTime } from '../../../shared/lib/date'
import { differenceInfo, signedMoney } from '../model/cashFormat'

const directions: CashDirection[] = ['kindergarten', 'school', 'shared']

interface TileProps {
  label: string
  value: string
  children?: ReactNode
}

const Tile = ({ label, value, children }: TileProps) => (
  <Box
    sx={{
      p: 2,
      borderRadius: '16px',
      bgcolor: brandColors.tableHead,
      boxShadow: brandColors.outline,
      minWidth: 0,
    }}
  >
    <Typography variant="body2" sx={{ color: brandColors.label, fontWeight: 700, mb: 0.5 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{value}</Typography>
    {children}
  </Box>
)

interface DeskCardProps {
  desk: CashDeskState
  canEdit: boolean
  canControl: boolean
  onOpenShift: () => void
  onAcceptPayment: () => void
  onExpense: () => void
  onTransfer: () => void
  onCloseShift: () => void
  onCorrection: () => void
}

export const DeskCard = ({
  desk,
  canEdit,
  canControl,
  onOpenShift,
  onAcceptPayment,
  onExpense,
  onTransfer,
  onCloseShift,
  onCorrection,
}: DeskCardProps) => {
  const shift = desk.openShift
  const last = desk.lastClosed
  const balance = shift ? shift.expected : (last?.closingCounted ?? '0')
  const lastDifference = last ? differenceInfo(toKopecks(last.difference)) : null
  const hasActions = canEdit || (canControl && !!shift)

  return (
    <Paper elevation={0} sx={{ borderRadius: '20px', boxShadow: brandColors.outline, p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: '14px',
            bgcolor: shift ? brandColors.orangeTint : brandColors.oliveTint,
            color: shift ? brandColors.orangeText : brandColors.inkOnOliveSoft,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <PointOfSaleOutlinedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.3 }}>
              {desk.name}
            </Typography>
            <Chip
              size="small"
              label={shift ? 'Зміна відкрита' : 'Зміну закрито'}
              sx={
                shift
                  ? { bgcolor: brandColors.paidBg, color: brandColors.paidText }
                  : { bgcolor: brandColors.oliveTint, color: brandColors.inkOnOliveSoft }
              }
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {shift
              ? `Відповідальна особа:${shift.openedBy.name}, з ${formatDateTime(shift.openedAt)}`
              : 'Зміну не відкрито'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          borderRadius: '16px',
          bgcolor: brandColors.oliveTint,
          color: brandColors.inkOnOlive,
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          mb: 2,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: brandColors.inkOnOliveSoft }}>Має бути в касі</Typography>
        <Typography sx={{ fontSize: { xs: 32, sm: 40 }, fontWeight: 900, lineHeight: 1.15 }}>
          {formatMoney(balance)}
        </Typography>
        {!shift && last && (
          <Typography variant="body2" sx={{ color: brandColors.inkOnOliveSoft, mt: 0.5 }}>
            За перерахунком при закритті {formatDateTime(last.closedAt)}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
          mb: shift ? 2 : 0,
        }}
      >
        {shift && (
          <>
            <Tile label="На початок зміни" value={formatMoney(shift.openingCounted)} />
            <Tile label="Надходження" value={signedMoney(shift.totals.income, 1)} />
            <Tile label="Видатки" value={signedMoney(shift.totals.expense, -1)} />
            <Tile label="Передано" value={signedMoney(shift.totals.transfer, -1)} />
            {toKopecks(shift.totals.correction) !== 0 && (
              <Tile label="Коригування" value={signedMoney(shift.totals.correction, 1)} />
            )}
          </>
        )}
        {last && lastDifference && (
          <Tile label="Останній перерахунок" value={formatMoney(last.closingCounted)}>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(last.closedAt)}, {last.closedBy.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: lastDifference.color }}>
              {lastDifference.text}
            </Typography>
          </Tile>
        )}
      </Box>

      {shift && (
        <Box sx={{ overflowX: 'auto', borderRadius: '16px', boxShadow: brandColors.outline }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' } }}>
                <TableCell>Напрям</TableCell>
                <TableCell align="right">Надходження</TableCell>
                <TableCell align="right">Видатки</TableCell>
                <TableCell align="right">Передачі</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {directions.map((direction) => {
                const totals = shift.totals.byDirection[direction]
                return (
                  <TableRow key={direction} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 700 }}>{cashDirectionLabels[direction]}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatMoney(totals.income)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatMoney(totals.expense)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatMoney(totals.transfer)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {hasActions && (
        <Box
          sx={{
            mt: 2.5,
            display: { xs: 'grid', sm: 'flex' },
            gridTemplateColumns: '1fr 1fr',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          {canEdit && !shift && (
            <Button variant="contained" onClick={onOpenShift} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
              Відкрити зміну
            </Button>
          )}
          {canEdit && shift && (
            <>
              <Button variant="outlined" onClick={onAcceptPayment}>
                Прийняти оплату
              </Button>
              <Button variant="outlined" onClick={onExpense}>
                Видати кошти
              </Button>
              <Button variant="outlined" onClick={onTransfer}>
                Передати кошти
              </Button>
            </>
          )}
          {canControl && shift && (
            <Button variant="outlined" color="inherit" onClick={onCorrection}>
              Коригування
            </Button>
          )}
          {canEdit && shift && (
            <Button variant="contained" onClick={onCloseShift} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
              Закрити зміну
            </Button>
          )}
        </Box>
      )}
    </Paper>
  )
}
