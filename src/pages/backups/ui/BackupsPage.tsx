import { useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  backupErrorLabel,
  backupKindLabels,
  backupRunStatusLabels,
  formatBytes,
  formatDateTime,
  formatTakenAt,
} from '../../../shared/api'
import { useBackupsStore } from '../model/backupsStore'
import { useCan } from '../../../entities/user'

export const BackupsPage = () => {
  const canEdit = useCan('backups', 'edit')
  const status = useBackupsStore((s) => s.status)
  const runs = useBackupsStore((s) => s.runs)
  const failed = useBackupsStore((s) => s.failed)
  const isCreating = useBackupsStore((s) => s.isCreating)
  const load = useBackupsStore((s) => s.load)
  const create = useBackupsStore((s) => s.create)

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  if (failed) {
    return (
      <Alert severity="error" action={<Button onClick={() => load().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }
  if (!status) return <Typography color="text.secondary">Завантаження…</Typography>

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
        <Stack spacing={1}>
          {!status.configured ? (
            <Alert severity="warning">
              Резервні копії не налаштовані. Додайте в .env бекенду рядок BACKUP_DIR з шляхом до теки, яка
              синхронізується з хмарою, і перезапустіть бекенд. Інструкція: docs/backups.md.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Тека: {status.dir}
              </Typography>
              <Typography>
                Остання успішна копія:{' '}
                {status.lastSuccess?.finishedAt ? formatDateTime(status.lastSuccess.finishedAt) : 'ще не було'}
              </Typography>
              {status.lastFailure && (
                <Typography color="error.main" variant="body2">
                  Остання помилка ({formatDateTime(status.lastFailure.startedAt)}): {backupErrorLabel(status.lastFailure.error ?? '')}
                </Typography>
              )}
              {status.stale && <Alert severity="warning">Остання резервна копія невдала або застаріла.</Alert>}
            </>
          )}
          {canEdit && (
            <Box>
              <Button
                variant="contained"
                disabled={!status.configured || status.running || isCreating}
                onClick={() => create().catch(() => undefined)}
                startIcon={isCreating ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {isCreating ? 'Створюється…' : 'Зробити копію зараз'}
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Файли копій
        </Typography>
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell align="right">Розмір</TableCell>
                <TableCell>Файл</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {status.files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>
                    Копій ще немає
                  </TableCell>
                </TableRow>
              )}
              {status.files.map((file) => (
                <TableRow key={file.name}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTakenAt(file.takenAt)}</TableCell>
                  <TableCell>{backupKindLabels[file.kind]}</TableCell>
                  <TableCell align="right">{formatBytes(file.sizeBytes)}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{file.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Останні запуски
        </Typography>
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Початок</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Хто</TableCell>
                <TableCell>Помилка</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                    Запусків ще не було
                  </TableCell>
                </TableRow>
              )}
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(run.startedAt)}</TableCell>
                  <TableCell>{backupKindLabels[run.kind]}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={backupRunStatusLabels[run.status]}
                      color={run.status === 'succeeded' ? 'success' : run.status === 'failed' ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{run.createdBy ? `${run.createdBy.lastName} ${run.createdBy.firstName}` : 'Автоматично'}</TableCell>
                  <TableCell sx={{ maxWidth: 360, wordBreak: 'break-word' }}>{run.error ? backupErrorLabel(run.error) : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Stack>
  )
}
