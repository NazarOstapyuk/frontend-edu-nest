import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { TermsDialog } from './TermsDialog'
import { CloseTermsDialog } from './CloseTermsDialog'
import { HistoryButton } from '../../../widgets/auditHistory'

type EditState = { terms: SalaryTerms | null } | null

const rateLabel = (rate: SalaryRate) => {
  const target = rate.subjectName ?? rate.classGroupName
  return `${payrollLessonTypeLabels[rate.lessonType]}${target ? `: ${target}` : ''} — ${formatMoney(rate.amount)}`
}

export const TermsTab = () => {
  const isPhone = useIsPhone()
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
  const [showInactive, setShowInactive] = useState(false)
  const selectedTeacher = teachers.find((t) => t.id === termsTeacherId)
  const teacherOptions = teachers.filter((t) => showInactive || t.isActive || t.id === termsTeacherId)
  const latest = terms.reduce<SalaryTerms | null>((a, b) => (a && a.validFrom >= b.validFrom ? a : b), null)

  const renderActions = (item: SalaryTerms) => (
    <>
      <HistoryButton entityType="salary-terms" entityId={item.id} title={`Умови з ${item.validFrom}`} />
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
    </>
  )

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
          sx={{ minWidth: { sm: 280 } }}
        >
          {teacherOptions.map((teacher) => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}{teacher.isActive ? '' : ' (неактивний)'}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Checkbox size="small" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />}
          label="Показати неактивних"
        />
        {canEdit && (
          <Button
            variant="contained"
            disabled={!termsTeacherId || isSaving || termsLoading || selectedTeacher?.isActive === false}
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
      ) : isPhone ? (
        <CardList
          items={terms}
          getKey={(item) => item.id}
          empty={<Typography color="text.secondary">{termsLoading ? 'Завантаження…' : 'Умов ще немає'}</Typography>}
          renderCard={(item) => (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatDay(item.validFrom)} – {item.validTo ? formatDay(item.validTo) : 'дотепер'}
                </Typography>
                {!item.started && <Chip size="small" label="Ще не діє" />}
              </Box>
              {item.note && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {item.note}
                </Typography>
              )}
              <CardField label="Ставка">{formatMoney(item.monthlyRate)}</CardField>
              {item.extraHourRate && <CardField label="Дод. година">{formatMoney(item.extraHourRate)}</CardField>}
              <CardField label="Календар">{payrollCalendarLabels[item.calendarKind]}</CardField>
              <CardField label="Ставки за заняття">
                {item.rates.length === 0
                  ? '—'
                  : item.rates.map((rate) => (
                      <Typography key={rate.id} variant="body2">
                        {rateLabel(rate)}
                      </Typography>
                    ))}
              </CardField>
              <CardField label="Доплати">
                {item.allowances.length === 0
                  ? '—'
                  : item.allowances.map((allowance) => (
                      <Typography key={allowance.id} variant="body2">
                        {allowance.name} — {formatMoney(allowance.amount)}
                      </Typography>
                    ))}
              </CardField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {renderActions(item)}
              </Box>
            </Box>
          )}
        />
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
                  <TableCell>
                    {formatMoney(item.monthlyRate)}
                    {item.extraHourRate && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Дод. година: {formatMoney(item.extraHourRate)}
                      </Typography>
                    )}
                  </TableCell>
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
                    {renderActions(item)}
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
          prefill={editing.terms ? null : latest}
          onClose={() => setEditing(null)}
        />
      )}
      {closing && <CloseTermsDialog terms={closing} onClose={() => setClosing(null)} />}
      <Dialog fullScreen={isPhone} open={!!deleting} onClose={() => setDeleting(null)}>
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
