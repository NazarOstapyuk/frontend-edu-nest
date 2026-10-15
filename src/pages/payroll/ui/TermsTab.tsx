import { useState } from 'react'
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
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import {
  formatDay,
  formatMoney,
  payrollApi,
  payrollCalendarLabels,
  payrollLessonTypeLabels,
  type SalaryRate,
  type SalaryTerms,
} from '../../../shared/api'
import { usePayrollStore } from '../model/payrollStore'
import { useCan } from '../../../entities/user'
import { TermsDialog } from './TermsDialog'
import { CloseTermsDialog } from './CloseTermsDialog'

type EditState = { terms: SalaryTerms | null } | null

const rateLabel = (rate: SalaryRate) => {
  const target = rate.subjectName ?? rate.classGroupName
  return `${payrollLessonTypeLabels[rate.lessonType]}${target ? `: ${target}` : ''} — ${formatMoney(rate.amount)}`
}

export const TermsTab = () => {
  const canEdit = useCan('payroll', 'edit')
  const teachers = usePayrollStore((s) => s.teachers)
  const termsTeacherId = usePayrollStore((s) => s.termsTeacherId)
  const terms = usePayrollStore((s) => s.terms)
  const termsLoading = usePayrollStore((s) => s.termsLoading)
  const termsFailed = usePayrollStore((s) => s.termsFailed)
  const setTermsTeacher = usePayrollStore((s) => s.setTermsTeacher)
  const loadTerms = usePayrollStore((s) => s.loadTerms)
  const runTerms = usePayrollStore((s) => s.runTerms)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const [editing, setEditing] = useState<EditState>(null)
  const [closing, setClosing] = useState<SalaryTerms | null>(null)
  const [deleting, setDeleting] = useState<SalaryTerms | null>(null)

  const confirmDelete = () => {
    if (!deleting) return
    runTerms(() => payrollApi.deleteTerms(deleting.id))
      .then(() => setDeleting(null))
      .catch(() => undefined)
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, alignItems: { sm: 'center' } }}>
        <TextField
          select
          size="small"
          label="Педагог"
          value={termsTeacherId}
          onChange={(event) => setTermsTeacher(event.target.value)}
          sx={{ minWidth: 280 }}
        >
          {teachers.map((teacher) => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </MenuItem>
          ))}
        </TextField>
        {canEdit && (
          <Button
            variant="contained"
            disabled={!termsTeacherId || isSaving}
            onClick={() => setEditing({ terms: null })}
          >
            Нова версія умов
          </Button>
        )}
      </Stack>

      {!termsTeacherId ? (
        <Typography color="text.secondary">Оберіть педагога, щоб побачити умови оплати.</Typography>
      ) : termsFailed ? (
        <Alert
          severity="error"
          action={<Button onClick={() => loadTerms().catch(() => undefined)}>Спробувати ще</Button>}
        >
          Не вдалося завантажити дані.
        </Alert>
      ) : (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Період</TableCell>
                <TableCell>Ставка</TableCell>
                <TableCell>Календар</TableCell>
                <TableCell>Ставки за заняття</TableCell>
                <TableCell>Доплати</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {terms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: 'text.secondary' }}>
                    {termsLoading ? 'Завантаження…' : 'Умов ще немає'}
                  </TableCell>
                </TableRow>
              )}
              {terms.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatDay(item.validFrom)} – {item.validTo ? formatDay(item.validTo) : 'дотепер'}
                    {!item.started && <Chip size="small" label="Ще не діє" sx={{ ml: 1 }} />}
                    {item.note && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {item.note}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatMoney(item.monthlyRate)}</TableCell>
                  <TableCell>{payrollCalendarLabels[item.calendarKind]}</TableCell>
                  <TableCell>
                    {item.rates.length === 0
                      ? '—'
                      : item.rates.map((rate) => (
                          <Typography key={rate.id} variant="body2">
                            {rateLabel(rate)}
                          </Typography>
                        ))}
                  </TableCell>
                  <TableCell>
                    {item.allowances.length === 0
                      ? '—'
                      : item.allowances.map((allowance) => (
                          <Typography key={allowance.id} variant="body2">
                            {allowance.name} — {formatMoney(allowance.amount)}
                          </Typography>
                        ))}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {canEdit && !item.started && (
                      <>
                        <Tooltip title="Редагувати">
                          <IconButton size="small" disabled={isSaving} onClick={() => setEditing({ terms: item })}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Видалити">
                          <IconButton size="small" disabled={isSaving} onClick={() => setDeleting(item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {canEdit && item.validTo === null && (
                      <Tooltip title="Закрити умови">
                        <IconButton size="small" disabled={isSaving} onClick={() => setClosing(item)}>
                          <EventBusyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {editing && (
        <TermsDialog
          key={editing.terms?.id ?? 'new'}
          teacherId={termsTeacherId}
          terms={editing.terms}
          onClose={() => setEditing(null)}
        />
      )}
      {closing && <CloseTermsDialog terms={closing} onClose={() => setClosing(null)} />}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>Видалити умови?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Ця версія ще не діє, її буде видалено.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Скасувати</Button>
          <Button color="error" disabled={isSaving} onClick={confirmDelete}>
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
