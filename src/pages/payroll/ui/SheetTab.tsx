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
import { formatMoney, monthLabel, payrollStatusLabels, shiftMonth } from '../../../shared/api'
import { usePayrollStore } from '../model/payrollStore'
import { PayrollDetailDialog } from './PayrollDetailDialog'

export const SheetTab = () => {
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
        <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
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
