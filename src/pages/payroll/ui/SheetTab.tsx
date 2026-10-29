import { useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { formatMoney, monthLabel, payrollStatusLabels, shiftMonth } from '../../../shared/api'
import { usePayrollStore } from '../model/payrollStore'
import { PayrollDetailDialog } from './PayrollDetailDialog'

export const SheetTab = () => {
  const isPhone = useIsPhone()
  const month = usePayrollStore((s) => s.month)
  const list = usePayrollStore((s) => s.list)
  const listFailed = usePayrollStore((s) => s.listFailed)
  const setMonth = usePayrollStore((s) => s.setMonth)
  const loadList = usePayrollStore((s) => s.loadList)
  const openDetail = usePayrollStore((s) => s.openDetail)

  useEffect(() => {
    loadList().catch(() => undefined)
  }, [loadList])

  const rows = list && list.month === month ? list.rows : null

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <IconButton aria-label="Попередній місяць" onClick={() => setMonth(shiftMonth(month, -1))}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: { xs: 0, sm: 200 }, flex: { xs: 1, sm: 'none' }, textAlign: 'center' }}>
          {monthLabel(month)}
        </Typography>
        <IconButton aria-label="Наступний місяць" onClick={() => setMonth(shiftMonth(month, 1))}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {listFailed ? (
        <Alert
          severity="error"
          action={<Button onClick={() => loadList().catch(() => undefined)}>Спробувати ще</Button>}
        >
          Не вдалося завантажити дані.
        </Alert>
      ) : isPhone ? (
        rows === null ? (
          <Typography color="text.secondary">Завантаження…</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <CardList
              items={rows}
              getKey={(row) => row.teacher.id}
              empty={
                <Typography color="text.secondary">У цьому місяці немає педагогів з умовами оплати</Typography>
              }
              renderCard={(row) => (
                <Box sx={{ cursor: 'pointer' }} onClick={() => openDetail(row.teacher.id)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
                      {row.teacher.lastName} {row.teacher.firstName}
                    </Typography>
                    <Chip
                      size="small"
                      label={payrollStatusLabels[row.status]}
                      color={row.status === 'approved' ? 'success' : 'default'}
                    />
                  </Box>
                  {(row.warnings.noRate > 0 || row.warnings.lessonsWithoutTerms > 0) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main', mb: 0.5 }}>
                      <WarningAmberIcon fontSize="small" />
                      <Typography variant="body2">Є заняття без ставки або поза умовами</Typography>
                    </Box>
                  )}
                  <CardField label="Занять">{row.lessons}</CardField>
                  <CardField label="Нараховано">{formatMoney(row.accrued)}</CardField>
                  <CardField label="Виплачено">{formatMoney(row.paid)}</CardField>
                  <CardField label="Залишок">{formatMoney(row.balance)}</CardField>
                </Box>
              )}
            />
            {list && rows.length > 0 && (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>Разом</Typography>
                <CardField label="Нараховано">{formatMoney(list.totals.accrued)}</CardField>
                <CardField label="Виплачено">{formatMoney(list.totals.paid)}</CardField>
                <CardField label="Залишок">{formatMoney(list.totals.balance)}</CardField>
              </Box>
            )}
          </Box>
        )
      ) : (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Педагог</TableCell>
                <TableCell align="right">Занять</TableCell>
                <TableCell align="right">Нараховано</TableCell>
                <TableCell align="right">Виплачено</TableCell>
                <TableCell align="right">Залишок</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows === null && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: 'text.secondary' }}>
                    Завантаження…
                  </TableCell>
                </TableRow>
              )}
              {rows?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: 'text.secondary' }}>
                    У цьому місяці немає педагогів з умовами оплати
                  </TableCell>
                </TableRow>
              )}
              {rows?.map((row) => (
                <TableRow key={row.teacher.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(row.teacher.id)}>
                  <TableCell>
                    {row.teacher.lastName} {row.teacher.firstName}
                    {(row.warnings.noRate > 0 || row.warnings.lessonsWithoutTerms > 0) && (
                      <Tooltip title="Є заняття без ставки або поза умовами">
                        <WarningAmberIcon color="warning" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right">{row.lessons}</TableCell>
                  <TableCell align="right">{formatMoney(row.accrued)}</TableCell>
                  <TableCell align="right">{formatMoney(row.paid)}</TableCell>
                  <TableCell align="right">{formatMoney(row.balance)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={payrollStatusLabels[row.status]}
                      color={row.status === 'approved' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {list && rows && rows.length > 0 && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Разом</TableCell>
                  <TableCell />
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatMoney(list.totals.accrued)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatMoney(list.totals.paid)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatMoney(list.totals.balance)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
      <PayrollDetailDialog />
    </Box>
  )
}
