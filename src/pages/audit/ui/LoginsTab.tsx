import { useEffect, useRef } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { authReasonLabels, authTypeLabels, type AuthEventType } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { useAuditStore } from '../model/auditStore'

const PAGE_SIZE = 50
const AGENT_LIMIT = 60

export const LoginsTab = () => {
  const isPhone = useIsPhone()
  const query = useAuditStore((s) => s.authQuery)
  const logins = useAuditStore((s) => s.logins)
  const failed = useAuditStore((s) => s.loginsFailed)
  const loadLogins = useAuditStore((s) => s.loadLogins)
  const setQuery = useAuditStore((s) => s.setAuthQuery)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    loadLogins().catch(() => undefined)
    return () => clearTimeout(timer.current)
  }, [loadLogins])

  const update = (partial: Parameters<typeof setQuery>[0]) => {
    setQuery(partial).catch(() => undefined)
  }

  const onLoginChange = (value: string) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => update({ login: value.trim() || undefined }), 400)
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
          label="Логін"
          size="small"
          defaultValue={query.login ?? ''}
          onChange={(e) => onLoginChange(e.target.value)}
        />
        <TextField
          select
          label="Подія"
          size="small"
          sx={{ minWidth: { sm: 220 } }}
          value={query.type ?? ''}
          onChange={(e) => update({ type: (e.target.value || undefined) as AuthEventType | undefined })}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Усі</MenuItem>
          {Object.entries(authTypeLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {failed ? (
        <Alert severity="error" action={<Button onClick={() => loadLogins().catch(() => undefined)}>Спробувати ще</Button>}>
          Не вдалося завантажити дані.
        </Alert>
      ) : !logins ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : isPhone ? (
        <Box>
          <CardList
            items={logins.items}
            getKey={(item) => item.id}
            empty={<Typography color="text.secondary">Записів немає</Typography>}
            renderCard={(item) => (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                  {authTypeLabels[item.type]}
                  {item.reason ? `: ${authReasonLabels[item.reason] ?? item.reason}` : ''}
                </Typography>
                <CardField label="Час">{new Date(item.at).toLocaleString('uk-UA')}</CardField>
                <CardField label="Логін">{item.login}</CardField>
                <CardField label="Користувач">
                  {item.user ? `${item.user.lastName} ${item.user.firstName}` : '—'}
                </CardField>
                <CardField label="IP">{item.ip ?? '—'}</CardField>
                <CardField label="Браузер">{item.userAgent ?? '—'}</CardField>
              </Box>
            )}
          />
          <TablePagination
            component="div"
            count={logins.total}
            page={logins.page - 1}
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
                <TableCell>Логін</TableCell>
                <TableCell>Користувач</TableCell>
                <TableCell>Подія</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Браузер</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logins.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                    Записів немає
                  </TableCell>
                </TableRow>
              ) : (
                logins.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.at).toLocaleString('uk-UA')}</TableCell>
                    <TableCell>{item.login}</TableCell>
                    <TableCell>{item.user ? `${item.user.lastName} ${item.user.firstName}` : '—'}</TableCell>
                    <TableCell>
                      {authTypeLabels[item.type]}
                      {item.reason ? `: ${authReasonLabels[item.reason] ?? item.reason}` : ''}
                    </TableCell>
                    <TableCell>{item.ip ?? '—'}</TableCell>
                    <TableCell>
                      {item.userAgent ? (
                        <Tooltip title={item.userAgent}>
                          <span>
                            {item.userAgent.length > AGENT_LIMIT
                              ? `${item.userAgent.slice(0, AGENT_LIMIT)}…`
                              : item.userAgent}
                          </span>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={logins.total}
            page={logins.page - 1}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[]}
            onPageChange={(_, page) => update({ page: page + 1 })}
          />
        </Paper>
      )}
    </Stack>
  )
}
