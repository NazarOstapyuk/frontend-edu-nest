import { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
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
import { actionLabel, entityTypeLabels, softList, usersApi } from '../../../shared/api'
import type { User } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { useAuditStore } from '../model/auditStore'

const PAGE_SIZE = 50

export const EventsTab = () => {
  const isPhone = useIsPhone()
  const query = useAuditStore((s) => s.eventsQuery)
  const events = useAuditStore((s) => s.events)
  const failed = useAuditStore((s) => s.eventsFailed)
  const loadEvents = useAuditStore((s) => s.loadEvents)
  const setQuery = useAuditStore((s) => s.setEventsQuery)
  const openEvent = useAuditStore((s) => s.openEvent)
  const [staff, setStaff] = useState<User[]>([])

  useEffect(() => {
    let stale = false
    softList(usersApi.getList()).then((users) => {
      if (!stale) setStaff(users.filter((u) => u.role !== 'parent'))
    })
    return () => {
      stale = true
    }
  }, [])

  useEffect(() => {
    loadEvents().catch(() => undefined)
  }, [loadEvents])

  const update = (partial: Parameters<typeof setQuery>[0]) => {
    setQuery(partial).catch(() => undefined)
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
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
          sx={{ minWidth: { sm: 220 } }}
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
        <Autocomplete
          size="small"
          sx={{ minWidth: { sm: 240 } }}
          options={staff}
          getOptionLabel={(u) => `${u.lastName} ${u.firstName}`}
          value={staff.find((u) => u.id === query.actorId) ?? null}
          onChange={(_, user) => update({ actorId: user?.id })}
          renderInput={(params) => <TextField {...params} label="Користувач" />}
        />
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
      ) : isPhone ? (
        <Box>
          <CardList
            items={events.items}
            getKey={(event) => event.id}
            empty={<Typography color="text.secondary">Записів немає</Typography>}
            renderCard={(event) => (
              <Box sx={{ cursor: 'pointer' }} onClick={() => openEvent(event.id).catch(() => undefined)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>{actionLabel(event.route)}</Typography>
                  <Chip
                    size="small"
                    label={event.statusCode}
                    color={event.statusCode >= 400 ? 'error' : 'success'}
                  />
                </Box>
                <CardField label="Час">{new Date(event.at).toLocaleString('uk-UA')}</CardField>
                <CardField label="Хто">
                  {event.actor ? `${event.actor.lastName} ${event.actor.firstName}` : '—'}
                </CardField>
                <CardField label="Об'єкт">
                  {event.entityType ? (entityTypeLabels[event.entityType] ?? event.entityType) : '—'}
                </CardField>
              </Box>
            )}
          />
          <TablePagination
            component="div"
            count={events.total}
            page={events.page - 1}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[]}
            onPageChange={(_, page) => update({ page: page + 1 })}
          />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
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
