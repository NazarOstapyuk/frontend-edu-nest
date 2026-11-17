import { useEffect, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import {
  cashApi,
  denominationLabel,
  formatMoney,
  reportsApi,
  toKopecks,
  type CashShiftReport,
} from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import { formatDate, formatDateTime } from '../../../shared/lib/date'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { differenceInfo, formatKopecks } from '../model/cashFormat'
import { EntriesList } from './EntriesList'

const Row = ({ label, value, color }: { label: string; value: ReactNode; color?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography sx={{ fontWeight: 800, textAlign: 'right', color }}>{value}</Typography>
  </Box>
)

const blockSx = { borderRadius: '16px', bgcolor: brandColors.tableHead, boxShadow: brandColors.outline, px: 2, py: 1.5 }

interface ShiftReportDialogProps {
  shiftId: string | null
  onClose: () => void
}

export const ShiftReportDialog = ({ shiftId, onClose }: ShiftReportDialogProps) => {
  const isPhone = useIsPhone()
  const [loaded, setLoaded] = useState<{ id: string; report: CashShiftReport | null } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!shiftId) return
    let active = true
    cashApi
      .getShift(shiftId)
      .then((report) => active && setLoaded({ id: shiftId, report }))
      .catch(() => active && setLoaded({ id: shiftId, report: null }))
    return () => {
      active = false
    }
  }, [shiftId, attempt])

  const current = loaded && (loaded.id === shiftId || !shiftId) ? loaded : null
  const report = current?.report ?? null
  const failed = !!current && !current.report
  const shift = report?.shift
  const rows = shift ? Object.entries(shift.denominations).filter(([, count]) => count > 0) : []
  const diff = shift?.difference != null ? differenceInfo(toKopecks(shift.difference)) : null

  const download = async () => {
    if (!shift?.closedAt) return
    setIsDownloading(true)
    try {
      await reportsApi.download('cash', { shiftId: shift.id }, `каса-зміна-${formatDate(shift.closedAt)}`, true)
    } catch {
      return
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={!!shiftId} onClose={onClose} fullWidth maxWidth="md" fullScreen={isPhone}
      slotProps={{ transition: { onExited: () => setLoaded(null) } }}
    >
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        {shift ? `Зміна: ${shift.deskName}` : 'Зміна'}
        <IconButton onClick={onClose} aria-label="Закрити" sx={{ minWidth: 40, minHeight: 40 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: '20px', pb: '20px' }}>
        {failed && (
          <Alert
            severity="error"
            action={
              shiftId && (
                <Button color="inherit" size="small" onClick={() => setAttempt((value) => value + 1)}>
                  Спробувати ще
                </Button>
              )
            }
          >
            Не вдалося завантажити зміну.
          </Alert>
        )}
        {!shift && !failed && <Skeleton variant="rounded" height={320} sx={{ borderRadius: '16px' }} />}
        {report && shift && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Box sx={blockSx}>
                <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Зміна</Typography>
                <Row label="Відкрито" value={formatDateTime(shift.openedAt)} />
                <Row label="Хто відкрив" value={shift.openedBy.name} />
                <Row label="Закрито" value={shift.closedAt ? formatDateTime(shift.closedAt) : 'Відкрита'} />
                {shift.closedBy && <Row label="Хто закрив" value={shift.closedBy.name} />}
                <Row label="Очікувалось на початок" value={formatMoney(shift.openingExpected)} />
                <Row label="Пораховано на початок" value={formatMoney(shift.openingCounted)} />
                {shift.openingNote && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Пояснення при відкритті: {shift.openingNote}
                  </Typography>
                )}
              </Box>
              <Box sx={blockSx}>
                <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Підсумки</Typography>
                <Row label="Надходження" value={formatMoney(shift.totals.income)} />
                <Row label="Видатки" value={formatMoney(shift.totals.expense)} />
                <Row label="Передачі" value={formatMoney(shift.totals.transfer)} />
                <Row label="Коригування" value={formatMoney(shift.totals.correction)} />
                <Row label="Має бути в касі" value={formatMoney(shift.closingExpected ?? shift.expected)} />
                {shift.closingCounted != null && <Row label="Фактично" value={formatMoney(shift.closingCounted)} />}
                {diff && <Row label="Різниця" value={diff.text} color={diff.color} />}
                {shift.closingNote && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Пояснення розбіжності: {shift.closingNote}
                  </Typography>
                )}
              </Box>
            </Box>

            {rows.length > 0 && (
              <Box>
                <Typography component="h3" sx={{ fontSize: 18, fontWeight: 900, mb: 1.5 }}>
                  Підрахунок при закритті
                </Typography>
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                        <TableCell>Номінал</TableCell>
                        <TableCell align="right">Кількість</TableCell>
                        <TableCell align="right">Сума</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map(([key, count]) => (
                        <TableRow key={key}>
                          <TableCell>{denominationLabel(key)}</TableCell>
                          <TableCell align="right">{count}</TableCell>
                          <TableCell align="right">{formatKopecks(Number(key) * count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            )}

            <EntriesList entries={report.entries} canEdit={false} />

            {shift.closedAt && (
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadOutlinedIcon />}
                  disabled={isDownloading}
                  onClick={download}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Завантажити Excel
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Dialog>
  )
}
