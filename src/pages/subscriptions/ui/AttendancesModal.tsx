import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import { useAttendancesStore } from '../model/attendancesStore'
import { subscriptionStatusLabels, type SubscriptionStatus } from '../../../shared/api'

const statusColors: Record<SubscriptionStatus, 'success' | 'default' | 'warning'> = {
  active: 'success',
  cancelled: 'default',
  finished: 'warning',
}

export const AttendancesModal = () => {
  const { isOpen, subscription, attendances, isLoading, isCreating, isDeleting } = useAttendancesStore()
  const close = useAttendancesStore((s) => s.close)
  const createAttendance = useAttendancesStore((s) => s.createAttendance)
  const deleteAttendance = useAttendancesStore((s) => s.deleteAttendance)

  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const handleMark = async () => {
    if (!subscription) return
    await createAttendance(subscription.id, {
      date: date || undefined,
      note: note.trim() || undefined,
    })
    setDate('')
    setNote('')
  }

  const progress = subscription
    ? ((subscription.totalSessions - subscription.remainingSessions) / subscription.totalSessions) * 100
    : 0

  return (
    <Dialog open={isOpen} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
        Відвідування
      </DialogTitle>

      {subscription && (
        <Box sx={{ px: 3, pt: 1, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subscription.child.lastName} {subscription.child.firstName} —{' '}
            {subscription.subscriptionType.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
              {subscription.remainingSessions} / {subscription.totalSessions}
            </Typography>
            <Chip
              label={subscriptionStatusLabels[subscription.status]}
              size="small"
              color={statusColors[subscription.status]}
              variant={subscription.status === 'active' ? 'filled' : 'outlined'}
            />
          </Box>
        </Box>
      )}

      <Divider />

      {subscription?.status === 'active' && (
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <TextField
            label="Дата і час"
            type="datetime-local"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: '0 0 200px' }}
          />
          <TextField
            label="Нотатка"
            size="small"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="необов'язково"
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={isCreating ? <CircularProgress size={14} color="inherit" /> : <EventAvailableIcon />}
            disabled={isCreating}
            onClick={handleMark}
            sx={{ whiteSpace: 'nowrap', mt: 0.25 }}
          >
            Відмітити
          </Button>
        </Box>
      )}

      <Divider />

      <Box sx={{ px: 3, py: 2, minHeight: 120, maxHeight: 360, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : attendances.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
            Відвідувань ще немає
          </Typography>
        ) : (
          attendances.map((attendance) => (
            <Box
              key={attendance.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0 },
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(attendance.date).toLocaleString('uk-UA', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
                {attendance.note && (
                  <Typography variant="caption" color="text.secondary">
                    {attendance.note}
                  </Typography>
                )}
              </Box>
              <Tooltip title="Скасувати відвідування">
                <IconButton
                  size="small"
                  color="error"
                  disabled={isDeleting}
                  onClick={() => subscription && deleteAttendance(subscription.id, attendance.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))
        )}
      </Box>

      <Divider />
      <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={close} color="inherit">Закрити</Button>
      </Box>
    </Dialog>
  )
}
