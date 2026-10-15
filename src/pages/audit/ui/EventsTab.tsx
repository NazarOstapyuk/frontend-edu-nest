import { useEffect } from 'react'
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { actionLabel, entityTypeLabels } from '../../../shared/api'
import { useAuditStore } from '../model/auditStore'

const PAGE_SIZE = 50

export const EventsTab = () => {
  const query = useAuditStore((s) => s.eventsQuery)
  const events = useAuditStore((s) => s.events)
  const failed = useAuditStore((s) => s.eventsFailed)
  const loadEvents = useAuditStore((s) => s.loadEvents)
  const setQuery = useAuditStore((s) => s.setEventsQuery)
  const openEvent = useAuditStore((s) => s.openEvent)

  useEffect(() => {
    loadEvents().catch(() => undefined)
  }, [loadEvents])

  const update = (partial: Parameters<typeof setQuery>[0]) => {
    setQuery(partial).catch(() => undefined)
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Від"
          type="date"
          size="small"
          value={query.from ?? ''}
          onChange={(e) => update({ from: e.target.value || undefined })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="До"
          type="date"
          size="small"
          value={query.to ?? ''}
          onChange={(e) => update({ to: e.target.value || undefined })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label="Тип об'єкта"
          size="small"
          sx={{ minWidth: 220 }}
          value={query.entityType ?? ''}
          onChange={(e) => update({ entityType: e.target.value || undefined })}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Усі</MenuItem>
          {Object.entries(entityTypeLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          label="Лише помилки"
          control={
            <Switch
              checked={query.failedOnly === 'true'}
              onChange={(e) => update({ failedOnly: e.target.checked ? 'true' : undefined })}
            />
          }
        />
      </Stack>
      {failed ? (
        <Alert severity="error" action={<Button onClick={() => loadEvents().catch(() => undefined)}>Спробувати ще</Button>}>
          Не вдалося завантажити дані.
        </Alert>
      ) : !events ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Час</TableCell>
                <TableCell>Хто</TableCell>
                <TableCell>Дія</TableCell>
                <TableCell>Об'єкт</TableCell>
                <TableCell>Результат</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                    Записів немає
                  </TableCell>
                </TableRow>
              ) : (
                events.items.map((event) => (
                  <TableRow
                    key={event.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openEvent(event.id).catch(() => undefined)}
                  >
                    <TableCell>{new Date(event.at).toLocaleString('uk-UA')}</TableCell>
                    <TableCell>
                      {event.actor ? `${event.actor.lastName} ${event.actor.firstName}` : '—'}
                    </TableCell>
                    <TableCell>{actionLabel(event.route)}</TableCell>
                    <TableCell>
                      {event.entityType ? (entityTypeLabels[event.entityType] ?? event.entityType) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={event.statusCode}
                        color={event.statusCode >= 400 ? 'error' : 'success'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={events.total}
            page={events.page - 1}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[]}
            onPageChange={(_, page) => update({ page: page + 1 })}
          />
        </Paper>
      )}
    </Stack>
  )
}
