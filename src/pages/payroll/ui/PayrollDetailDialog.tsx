import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { monthLabel, payrollApi, payrollStatusLabels } from '../../../shared/api'
import { PayrollDetailView } from '../../../widgets/payrollDetail'
import { usePayrollStore } from '../model/payrollStore'
import { useCan } from '../../../entities/user'
import { AdjustmentDialog } from './AdjustmentDialog'
import { PaymentDialog } from './PaymentDialog'
import { ReasonDialog } from './ReasonDialog'
import { WorkedDaysForm } from './WorkedDaysForm'

type Modal =
  | { kind: 'adjustment' }
  | { kind: 'payment' }
  | { kind: 'reopen' }
  | { kind: 'voidAdjustment'; id: string }
  | { kind: 'voidPayment'; id: string }
  | null

export const PayrollDetailDialog = () => {
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
  const voidTarget = modal && (modal.kind === 'voidAdjustment' || modal.kind === 'voidPayment') ? modal : null

  return (
    <Dialog open fullWidth maxWidth="md" onClose={closeDetail}>
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
            {canEdit && draft && (
              <WorkedDaysForm key={`${detail.days.workedDays}-${String(detail.days.override)}`} detail={detail} />
            )}
            <PayrollDetailView
              detail={detail}
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
      {modal?.kind === 'reopen' && (
        <ReasonDialog
          title="Відкрити відомість повторно"
          onClose={closeModal}
          onSubmit={(reason) => runDetail((teacherId, month) => payrollApi.reopen(teacherId, month, reason))}
        />
      )}
      {voidTarget && (
        <ReasonDialog
          title={voidTarget.kind === 'voidAdjustment' ? 'Анулювати запис' : 'Анулювати виплату'}
          onClose={closeModal}
          onSubmit={(reason) =>
            runDetail(() =>
              voidTarget.kind === 'voidAdjustment'
                ? payrollApi.voidAdjustment(voidTarget.id, reason)
                : payrollApi.voidPayment(voidTarget.id, reason),
            )
          }
        />
      )}
    </Dialog>
  )
}
