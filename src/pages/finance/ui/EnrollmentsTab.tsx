import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
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
import AddIcon from '@mui/icons-material/Add'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useEnrollmentsStore } from '../model/enrollmentsStore'
import { useCan } from '../../../entities/user'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import {
  adjustmentTypeLabels,
  billingModeLabels,
  chargeStateLabels,
  formatMoney,
  type Enrollment,
  type EnrollmentAdjustment,
} from '../../../shared/api'
import { CreateEnrollmentModal } from './CreateEnrollmentModal'
import { EndEnrollmentModal } from './EndEnrollmentModal'
import { AdjustmentModal } from './AdjustmentModal'

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA', { timeZone: 'UTC' })

const adjustmentLabel = (a: EnrollmentAdjustment) => {
  const value =
    a.type === 'pause' ? '' : a.type === 'discount_percent' ? ` ${Number(a.value)}%` : ` ${formatMoney(a.value ?? '0')}`
  const range = `${formatDate(a.startDate)}–${a.endDate ? formatDate(a.endDate) : '…'}`
  return `${adjustmentTypeLabels[a.type]}${value}, ${range}`
}

const EnrollmentRow = ({ enrollment }: { enrollment: Enrollment }) => {
  const [open, setOpen] = useState(() => enrollment.billedPeriods.some((p) => p.needsRecalculation))
  const setEndEnrollmentModal = useEnrollmentsStore((s) => s.setEndEnrollmentModal)
  const setAdjustmentModal = useEnrollmentsStore((s) => s.setAdjustmentModal)
  const setReasonTarget = useEnrollmentsStore((s) => s.setReasonTarget)
  const billNow = useEnrollmentsStore((s) => s.billNow)
  const isSaving = useEnrollmentsStore((s) => s.isSaving)
  const canEdit = useCan('finance', 'edit')
  const next = enrollment.nextPeriod

  return (
    <>
      <TableRow>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 500 }}>
          {enrollment.tariff.name}
          {enrollment.billedPeriods.some((p) => p.needsRecalculation) && (
            <Chip size="small" color="warning" label="Потрібен перерахунок" sx={{ ml: 1 }} />
          )}
        </TableCell>
        <TableCell>
          {formatDate(enrollment.startDate)} – {enrollment.endDate ? formatDate(enrollment.endDate) : '…'}
        </TableCell>
        <TableCell>
          {billingModeLabels[enrollment.effectiveBillingMode]}
          {enrollment.billingMode ? ' (свій)' : ''}
        </TableCell>
        <TableCell>
          {next === null
            ? '—'
            : next.problem
              ? <Typography variant="body2" color="error.main">Немає ціни на {formatDate(next.periodStart)}</Typography>
              : <Tooltip title={next.description ?? ''}><span>{formatMoney(next.amount ?? '0')} з {formatDate(next.periodStart)}</span></Tooltip>}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {enrollment.adjustments
              .filter((a) => !a.voidedAt)
              .map((a) => (
                <Chip
                  key={a.id}
                  size="small"
                  variant="outlined"
                  label={adjustmentLabel(a)}
                  onDelete={() =>
                    setReasonTarget({ kind: 'adjustment', id: a.id, title: `Сторнувати умову: ${adjustmentLabel(a)}` })
                  }
                />
              ))}
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {canEdit && (
            <Button size="small" disabled={isSaving} onClick={() => billNow(enrollment.id)}>
              Нарахувати
            </Button>
          )}
          {canEdit && (
            <Button size="small" onClick={() => setAdjustmentModal({ isOpen: true, enrollment })}>
              Умова
            </Button>
          )}
          {canEdit && !enrollment.endDate && (
            <Button size="small" color="error" onClick={() => setEndEnrollmentModal({ isOpen: true, enrollment })}>
              Завершити
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ py: 2 }}>
              {enrollment.billedPeriods.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Ще нічого не нараховано.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Період</TableCell>
                      <TableCell align="right">Сума</TableCell>
                      <TableCell>Стан</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrollment.billedPeriods.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                        </TableCell>
                        <TableCell align="right">{formatMoney(p.amount)}</TableCell>
                        <TableCell>
                          {p.needsRecalculation
                            ? 'Потребує перерахунку'
                            : p.note === 'pause'
                              ? 'Пауза'
                              : p.chargeVoided
                                ? 'Нарахування сторновано'
                                : p.chargeState
                                  ? chargeStateLabels[p.chargeState]
                                  : '—'}
                        </TableCell>
                        <TableCell align="right">
                          {canEdit && (
                            <Button
                              size="small"
                              color={p.needsRecalculation ? 'warning' : 'inherit'}
                              onClick={() =>
                                setReasonTarget({
                                  kind: 'recalculate',
                                  id: p.id,
                                  title: `Перерахувати період ${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`,
                                })
                              }
                            >
                              Перерахувати
                            </Button>
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

interface EnrollmentsTabProps {
  childId: string
}

export const EnrollmentsTab = ({ childId }: EnrollmentsTabProps) => {
  const enrollments = useEnrollmentsStore((s) => s.enrollments)
  const storeChildId = useEnrollmentsStore((s) => s.childId)
  const fetchEnrollments = useEnrollmentsStore((s) => s.fetchEnrollments)
  const setCreateEnrollmentModal = useEnrollmentsStore((s) => s.setCreateEnrollmentModal)
  const reasonTarget = useEnrollmentsStore((s) => s.reasonTarget)
  const setReasonTarget = useEnrollmentsStore((s) => s.setReasonTarget)
  const submitReason = useEnrollmentsStore((s) => s.submitReason)
  const isSaving = useEnrollmentsStore((s) => s.isSaving)
  const canEdit = useCan('finance', 'edit')

  useEffect(() => {
    fetchEnrollments(childId)
  }, [childId, fetchEnrollments])

  const rows = storeChildId === childId ? enrollments : []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateEnrollmentModal({ isOpen: true })}>
            Записати на тариф
          </Button>
        )}
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell />
              <TableCell>Тариф</TableCell>
              <TableCell>Період запису</TableCell>
              <TableCell>Режим</TableCell>
              <TableCell>Наступне нарахування</TableCell>
              <TableCell>Умови</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Записів на тарифи ще немає.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((e) => <EnrollmentRow key={e.id} enrollment={e} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateEnrollmentModal />
      <EndEnrollmentModal />
      <AdjustmentModal />
      <ReasonDialog
        open={reasonTarget !== null}
        title={reasonTarget?.title ?? ''}
        subtitle={
          reasonTarget?.kind === 'recalculate'
            ? 'Поточне нарахування буде сторновано і створено нове за актуальними умовами. Оплати, розподілені на старе нарахування, повернуться в передоплату — їх треба розподілити знову.'
            : 'Умова перестане діяти для ще не нарахованих періодів.'
        }
        isSaving={isSaving}
        onClose={() => setReasonTarget(null)}
        onSubmit={submitReason}
      />
    </Box>
  )
}
