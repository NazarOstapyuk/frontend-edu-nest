import { useEffect, useState } from 'react'
import { Box, Button, Paper, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import { useAbsenceNoticesStore } from '../model/absenceNoticesStore'
import { useCan } from '../../../entities/user'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { formatDay, type AdminNotice, type NoticeStatus } from '../../../shared/api'

const tabs: { status: NoticeStatus; label: string }[] = [
  { status: 'pending', label: 'Очікують' },
  { status: 'approved', label: 'Підтверджені' },
  { status: 'rejected', label: 'Відхилені' },
  { status: 'cancelled', label: 'Скасовані' },
]

export const AbsenceNoticesPage = () => {
  const canEdit = useCan('register', 'edit')
  const status = useAbsenceNoticesStore((s) => s.status)
  const notices = useAbsenceNoticesStore((s) => s.notices)
  const isLoading = useAbsenceNoticesStore((s) => s.isLoading)
  const isSaving = useAbsenceNoticesStore((s) => s.isSaving)
  const loadFailed = useAbsenceNoticesStore((s) => s.loadFailed)
  const setStatus = useAbsenceNoticesStore((s) => s.setStatus)
  const approve = useAbsenceNoticesStore((s) => s.approve)
  const reject = useAbsenceNoticesStore((s) => s.reject)
  const cancel = useAbsenceNoticesStore((s) => s.cancel)
  const [dialog, setDialog] = useState<{ notice: AdminNotice; action: 'reject' | 'cancel' } | null>(null)

  useEffect(() => {
    setStatus(useAbsenceNoticesStore.getState().status).catch(() => undefined)
  }, [setStatus])

  return (
    <Box>
      <Tabs value={status} onChange={(_, v: NoticeStatus) => setStatus(v).catch(() => undefined)} variant="scrollable" sx={{ mb: 2 }}>
        {tabs.map((t) => <Tab key={t.status} value={t.status} label={t.label} />)}
      </Tabs>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Дитина</TableCell>
              <TableCell>Група</TableCell>
              <TableCell>Період</TableCell>
              <TableCell>Причина</TableCell>
              <TableCell>Коментар</TableCell>
              <TableCell>Подав</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ color: 'text.secondary' }}>{isLoading ? (
                    'Завантаження…'
                  ) : loadFailed ? (
                    <>
                      Не вдалося завантажити дані.
                      <Button size="small" sx={{ ml: 1 }} onClick={() => setStatus(status).catch(() => undefined)}>Спробувати ще</Button>
                    </>
                  ) : (
                    'Повідомлень немає.'
                  )}</TableCell>
              </TableRow>
            ) : (
              notices.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.child.lastName} {n.child.firstName}</TableCell>
                  <TableCell>{n.child.group?.name ?? '—'}</TableCell>
                  <TableCell>{formatDay(n.startDate)} – {formatDay(n.endDate)}</TableCell>
                  <TableCell>{n.reason.name}</TableCell>
                  <TableCell>
                    {n.comment ?? '—'}
                    {n.decisionReason && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Рішення: {n.decisionReason}</Typography>}
                  </TableCell>
                  <TableCell>{n.createdBy.lastName} {n.createdBy.firstName}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {canEdit && n.status === 'pending' && (
                      <>
                        <Button size="small" disabled={isSaving} onClick={() => approve(n.id).catch(() => undefined)}>Підтвердити</Button>
                        <Button size="small" color="error" disabled={isSaving} onClick={() => setDialog({ notice: n, action: 'reject' })}>Відхилити</Button>
                      </>
                    )}
                    {canEdit && n.status === 'approved' && (
                      <Button size="small" color="error" disabled={isSaving} onClick={() => setDialog({ notice: n, action: 'cancel' })}>Скасувати</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      <ReasonDialog
        open={dialog !== null}
        title={dialog?.action === 'cancel' ? 'Скасувати підтверджене повідомлення' : 'Відхилити повідомлення'}
        subtitle={dialog ? `${dialog.notice.child.lastName} ${dialog.notice.child.firstName}, ${formatDay(dialog.notice.startDate)} – ${formatDay(dialog.notice.endDate)}` : undefined}
        confirmLabel={dialog?.action === 'cancel' ? 'Скасувати' : 'Відхилити'}
        isSaving={isSaving}
        onClose={() => setDialog(null)}
        onSubmit={async (reason) => {
          if (!dialog) return
          if (dialog.action === 'cancel') await cancel(dialog.notice.id, reason)
          else await reject(dialog.notice.id, reason)
          setDialog(null)
        }}
      />
    </Box>
  )
}
