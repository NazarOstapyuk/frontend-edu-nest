import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { monthLabel, payrollApi, payrollStatusLabels } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { PayrollDetailView } from '../../../widgets/payrollDetail'
import { usePayrollStore } from '../model/payrollStore'
import { useCan } from '../../../entities/user'
import { AbsenceDialog } from './AbsenceDialog'
import { AdjustmentDialog } from './AdjustmentDialog'
import { ExtraHoursDialog } from './ExtraHoursDialog'
import { PaymentDialog } from './PaymentDialog'
import { ReasonDialog } from './ReasonDialog'
import { WorkedDaysForm } from './WorkedDaysForm'

type Modal =
  | { kind: 'adjustment' }
  | { kind: 'payment' }
  | { kind: 'extraHours' }
  | { kind: 'absence' }
  | { kind: 'reopen' }
  | { kind: 'voidAdjustment'; id: string }
  | { kind: 'voidPayment'; id: string }
  | { kind: 'voidExtraHours'; id: string }
  | { kind: 'voidAbsence'; id: string }
  | null

export const PayrollDetailDialog = () => {
  const isPhone = useIsPhone()
  const canEdit = useCan('payroll', 'edit')
  const detailTeacherId = usePayrollStore((s) => s.detailTeacherId)
  const detail = usePayrollStore((s) => s.detail)
  const detailFailed = usePayrollStore((s) => s.detailFailed)
  const closeDetail = usePayrollStore((s) => s.closeDetail)
  const loadDetail = usePayrollStore((s) => s.loadDetail)
  const runDetail = usePayrollStore((s) => s.runDetail)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const [modal, setModal] = useState<Modal>(null)

  if (!detailTeacherId) return null

  const draft = detail?.status === 'draft'
  const closeModal = () => setModal(null)
  const approve = () => {
    runDetail((teacherId, month) => payrollApi.approve(teacherId, month)).catch(() => undefined)
  }
  const voidTarget =
    modal &&
    (modal.kind === 'voidAdjustment' ||
      modal.kind === 'voidPayment' ||
      modal.kind === 'voidExtraHours' ||
      modal.kind === 'voidAbsence')
      ? modal
      : null
  const voidTitles = {
    voidAdjustment: 'Анулювати запис',
    voidPayment: 'Анулювати виплату',
    voidExtraHours: 'Анулювати додаткові години',
    voidAbsence: 'Анулювати відсутність',
  }
  const submitVoid = (target: NonNullable<typeof voidTarget>, reason: string) => {
    if (target.kind === 'voidAdjustment') return runDetail(() => payrollApi.voidAdjustment(target.id, reason))
    if (target.kind === 'voidPayment') return runDetail(() => payrollApi.voidPayment(target.id, reason))
    if (target.kind === 'voidExtraHours') return runDetail(() => payrollApi.voidExtraHours(target.id, reason))
    return runDetail(async (teacherId, month) => {
      await payrollApi.voidAbsence(target.id, reason)
      return payrollApi.getDetail(teacherId, month)
    })
  }
  const toggleVisibility = (visible: boolean) => {
    runDetail(async (teacherId, month) => {
      await payrollApi.setDetailsVisibility(teacherId, visible)
      return payrollApi.getDetail(teacherId, month)
    }).catch(() => undefined)
  }
  const editDraft = canEdit && draft

  return (
    <Dialog fullScreen={isPhone} open fullWidth maxWidth="md" onClose={closeDetail}>
      <DialogTitle>
        {detail ? `${detail.teacher.lastName} ${detail.teacher.firstName}` : 'Відомість'}
        {detail && (
          <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
            {monthLabel(detail.month)}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {detailFailed ? (
          <Alert
            severity="error"
            action={<Button onClick={() => loadDetail().catch(() => undefined)}>Спробувати ще</Button>}
          >
            Не вдалося завантажити дані.
          </Alert>
        ) : !detail ? (
          <Typography color="text.secondary">Завантаження…</Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip
                size="small"
                label={payrollStatusLabels[detail.status]}
                color={detail.status === 'approved' ? 'success' : 'default'}
              />
              {draft && detail.reopenReason && (
                <Typography variant="body2" color="text.secondary">
                  Відкрито повторно: {detail.reopenReason}
                </Typography>
              )}
            </Stack>
            {detail.payrollDetailsVisible !== undefined && (
              <FormControlLabel
                control={
                  <Switch
                    checked={detail.payrollDetailsVisible}
                    disabled={!canEdit || isSaving}
                    onChange={(event) => toggleVisibility(event.target.checked)}
                  />
                }
                label="Педагог бачить додаткові години й відсутності в «Моя зарплата»"
              />
            )}
            {canEdit && draft && (
              <WorkedDaysForm key={`${detail.days.workedDays}-${String(detail.days.override)}`} detail={detail} />
            )}
            <PayrollDetailView
              detail={detail}
              actions={
                editDraft
                  ? {
                      extraHours: (
                        <Button size="small" disabled={isSaving} onClick={() => setModal({ kind: 'extraHours' })}>
                          Додати
                        </Button>
                      ),
                      absences: (
                        <Button size="small" disabled={isSaving} onClick={() => setModal({ kind: 'absence' })}>
                          Додати
                        </Button>
                      ),
                    }
                  : undefined
              }
              onVoidExtraHours={editDraft ? (id) => setModal({ kind: 'voidExtraHours', id }) : undefined}
              onVoidAbsence={editDraft ? (id) => setModal({ kind: 'voidAbsence', id }) : undefined}
              onVoidAdjustment={canEdit && draft ? (id) => setModal({ kind: 'voidAdjustment', id }) : undefined}
              onVoidPayment={canEdit ? (id) => setModal({ kind: 'voidPayment', id }) : undefined}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {canEdit && detail && draft && (
          <Button disabled={isSaving} onClick={() => setModal({ kind: 'adjustment' })}>
            Доплата / утримання
          </Button>
        )}
        {canEdit && detail && (
          <Button disabled={isSaving} onClick={() => setModal({ kind: 'payment' })}>
            Виплата
          </Button>
        )}
        {canEdit && detail && draft && (
          <Button variant="contained" disabled={isSaving} onClick={approve}>
            Затвердити
          </Button>
        )}
        {canEdit && detail && !draft && (
          <Button color="warning" disabled={isSaving} onClick={() => setModal({ kind: 'reopen' })}>
            Відкрити повторно
          </Button>
        )}
        <Button onClick={closeDetail}>Закрити</Button>
      </DialogActions>

      {modal?.kind === 'adjustment' && <AdjustmentDialog onClose={closeModal} />}
      {modal?.kind === 'payment' && <PaymentDialog onClose={closeModal} />}
      {modal?.kind === 'extraHours' && <ExtraHoursDialog onClose={closeModal} />}
      {modal?.kind === 'absence' && <AbsenceDialog onClose={closeModal} />}
      {modal?.kind === 'reopen' && (
        <ReasonDialog
          title="Відкрити відомість повторно"
          onClose={closeModal}
          onSubmit={(reason) => runDetail((teacherId, month) => payrollApi.reopen(teacherId, month, reason))}
        />
      )}
      {voidTarget && (
        <ReasonDialog
          title={voidTitles[voidTarget.kind]}
          onClose={closeModal}
          onSubmit={(reason) => submitVoid(voidTarget, reason)}
        />
      )}
    </Dialog>
  )
}
