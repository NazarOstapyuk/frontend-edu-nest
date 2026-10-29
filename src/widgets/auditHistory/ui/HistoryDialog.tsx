import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Pagination,
  Stack,
  Typography,
} from '@mui/material'
import { auditApi, changeActionLabels, formatDateTime, type AuditChange } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { ChangesTable } from './ChangesTable'

const PAGE_SIZE = 50

interface Loaded {
  key: string
  items: AuditChange[]
  total: number
  failed: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  entityType: string
  entityId: string
  title: string
}

export const HistoryDialog = ({ open, onClose, entityType, entityId, title }: Props) => {
  const isPhone = useIsPhone()
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const key = `${entityType}:${entityId}:${page}:${attempt}`

  useEffect(() => {
    if (!open) return
    let stale = false
    auditApi
      .changes(entityType, entityId, page)
      .then((res) => {
        if (!stale) setLoaded({ key, items: res.data.items, total: res.data.total, failed: false })
      })
      .catch(() => {
        if (!stale) setLoaded({ key, items: [], total: 0, failed: true })
      })
    return () => {
      stale = true
    }
  }, [open, entityType, entityId, page, key])

  const handleClose = useCallback(() => {
    setPage(1)
    setAttempt(0)
    setLoaded(null)
    onClose()
  }, [onClose])

  const current = loaded && loaded.key === key ? loaded : null

  return (
    <Dialog fullScreen={isPhone} open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Історія: {title}</DialogTitle>
      <DialogContent>
        {current === null ? (
          <Typography color="text.secondary">Завантаження…</Typography>
        ) : current.failed ? (
          <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Typography color="error">Не вдалося завантажити дані.</Typography>
            <Button size="small" onClick={() => setAttempt((a) => a + 1)}>
              Спробувати ще
            </Button>
          </Stack>
        ) : current.items.length === 0 ? (
          <Typography color="text.secondary">Змін не записано</Typography>
        ) : (
          <Stack spacing={2}>
            {current.items.map((change) => (
              <Box key={change.id}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {formatDateTime(change.at)} ·{' '}
                  {change.actor ? `${change.actor.lastName} ${change.actor.firstName}` : '—'} ·{' '}
                  {changeActionLabels[change.action]}
                </Typography>
                <ChangesTable changes={change.changes} />
              </Box>
            ))}
            {current.total > PAGE_SIZE && (
              <Pagination
                count={Math.ceil(current.total / PAGE_SIZE)}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Закрити</Button>
      </DialogActions>
    </Dialog>
  )
}
