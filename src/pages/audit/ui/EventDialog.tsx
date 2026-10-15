import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { actionLabel, changeActionLabels, entityTypeLabels } from '../../../shared/api'
import { ChangesTable } from '../../../widgets/auditHistory'
import { useAuditStore } from '../model/auditStore'

export const EventDialog = () => {
  const selectedId = useAuditStore((s) => s.selectedId)
  const detail = useAuditStore((s) => s.detail)
  const failed = useAuditStore((s) => s.detailFailed)
  const closeEvent = useAuditStore((s) => s.closeEvent)

  return (
    <Dialog open={selectedId !== null} onClose={closeEvent} fullWidth maxWidth="md">
      <DialogTitle>{detail ? actionLabel(detail.route) : 'Подія'}</DialogTitle>
      <DialogContent>
        {failed ? (
          <Alert severity="error">Не вдалося завантажити дані.</Alert>
        ) : !detail ? (
          <Typography color="text.secondary">Завантаження…</Typography>
        ) : (
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="body2">Час: {new Date(detail.at).toLocaleString('uk-UA')}</Typography>
              <Typography variant="body2">
                Хто: {detail.actor ? `${detail.actor.lastName} ${detail.actor.firstName} (${detail.actor.login})` : '—'}
              </Typography>
              <Typography variant="body2">Запит: {detail.route}</Typography>
              <Typography variant="body2">Статус: {detail.statusCode}</Typography>
              <Typography variant="body2">IP: {detail.ip ?? '—'}</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                Браузер: {detail.userAgent ?? '—'}
              </Typography>
            </Stack>
            <Typography variant="subtitle2">Зміни</Typography>
            {detail.changes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Без змін полів
              </Typography>
            ) : (
              detail.changes.map((change) => (
                <Stack key={change.id} spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {entityTypeLabels[change.entityType] ?? change.entityType}: {changeActionLabels[change.action]}
                  </Typography>
                  <ChangesTable changes={change.changes} />
                </Stack>
              ))
            )}
            <Typography variant="subtitle2">Тіло запиту</Typography>
            <Box
              component="pre"
              sx={{ m: 0, p: 1.5, bgcolor: 'grey.50', border: 1, borderColor: 'divider', overflow: 'auto', fontSize: 12 }}
            >
              {detail.body ? JSON.stringify(detail.body, null, 2) : '—'}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeEvent}>Закрити</Button>
      </DialogActions>
    </Dialog>
  )
}
