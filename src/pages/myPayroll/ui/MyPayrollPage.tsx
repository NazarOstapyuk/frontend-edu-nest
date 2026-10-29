import { useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { formatMoney, monthLabel, payrollStatusLabels } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { PayrollDetailView } from '../../../widgets/payrollDetail'
import { useMyPayrollStore } from '../model/myPayrollStore'

export const MyPayrollPage = () => {
  const isPhone = useIsPhone()
  const year = useMyPayrollStore((s) => s.year)
  const data = useMyPayrollStore((s) => s.data)
  const failed = useMyPayrollStore((s) => s.failed)
  const setYear = useMyPayrollStore((s) => s.setYear)
  const load = useMyPayrollStore((s) => s.load)
  const month = useMyPayrollStore((s) => s.month)
  const detail = useMyPayrollStore((s) => s.detail)
  const detailFailed = useMyPayrollStore((s) => s.detailFailed)
  const openMonth = useMyPayrollStore((s) => s.openMonth)
  const closeMonth = useMyPayrollStore((s) => s.closeMonth)
  const loadMonth = useMyPayrollStore((s) => s.loadMonth)

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  const months = data && data.year === year ? data.months : null

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <IconButton aria-label="Попередній рік" onClick={() => setYear(year - 1)}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: 80, textAlign: 'center' }}>
          {year}
        </Typography>
        <IconButton aria-label="Наступний рік" onClick={() => setYear(year + 1)}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {failed ? (
        <Alert severity="error" action={<Button onClick={() => load().catch(() => undefined)}>Спробувати ще</Button>}>
          Не вдалося завантажити дані.
        </Alert>
      ) : isPhone ? (
        months === null ? (
          <Typography color="text.secondary">Завантаження…</Typography>
        ) : (
          <CardList
            items={months}
            getKey={(item) => item.month}
            empty={<Typography color="text.secondary">За цей рік даних про зарплату немає</Typography>}
            renderCard={(item) => (
              <Box sx={{ cursor: 'pointer' }} onClick={() => openMonth(item.month)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>{monthLabel(item.month)}</Typography>
                  <Chip
                    size="small"
                    label={payrollStatusLabels[item.status]}
                    color={item.status === 'approved' ? 'success' : 'default'}
                  />
                </Box>
                <CardField label="Нараховано">{formatMoney(item.accrued)}</CardField>
                <CardField label="Виплачено">{formatMoney(item.paid)}</CardField>
                <CardField label="Залишок">{formatMoney(item.balance)}</CardField>
              </Box>
            )}
          />
        )
      ) : (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Місяць</TableCell>
                <TableCell align="right">Нараховано</TableCell>
                <TableCell align="right">Виплачено</TableCell>
                <TableCell align="right">Залишок</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {months === null && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                    Завантаження…
                  </TableCell>
                </TableRow>
              )}
              {months?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                    За цей рік даних про зарплату немає
                  </TableCell>
                </TableRow>
              )}
              {months?.map((item) => (
                <TableRow key={item.month} hover sx={{ cursor: 'pointer' }} onClick={() => openMonth(item.month)}>
                  <TableCell>{monthLabel(item.month)}</TableCell>
                  <TableCell align="right">{formatMoney(item.accrued)}</TableCell>
                  <TableCell align="right">{formatMoney(item.paid)}</TableCell>
                  <TableCell align="right">{formatMoney(item.balance)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={payrollStatusLabels[item.status]}
                      color={item.status === 'approved' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog fullScreen={isPhone} open={month !== null} fullWidth maxWidth="md" onClose={closeMonth}>
        <DialogTitle>{month ? monthLabel(month) : ''}</DialogTitle>
        <DialogContent dividers>
          {detailFailed ? (
            <Alert
              severity="error"
              action={<Button onClick={() => loadMonth().catch(() => undefined)}>Спробувати ще</Button>}
            >
              Не вдалося завантажити дані.
            </Alert>
          ) : detail ? (
            <Stack spacing={2}>
              {detail.status === 'draft' && (
                <Alert severity="info">Чернетка: суми можуть змінитися до затвердження.</Alert>
              )}
              <PayrollDetailView detail={detail} showWarnings={false} />
            </Stack>
          ) : (
            <Typography color="text.secondary">Завантаження…</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMonth}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
