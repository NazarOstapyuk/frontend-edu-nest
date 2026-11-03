import { Fragment, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import BlockIcon from '@mui/icons-material/Block'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { useAuthStore } from '../../../entities/user'
import { formatTaskMoment, isGivenTaskClosed, isStaffTaskRole, type GivenTask, type GivenTaskAssignee } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList } from '../../../shared/ui/CardList'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useTasksStore } from '../model/tasksStore'
import { TaskDialog } from './TaskDialog'

const StateChip = ({ task }: { task: GivenTask }) => {
  if (task.cancelledAt) return <Chip size="small" variant="outlined" label="Скасовано" />
  if (isGivenTaskClosed(task)) return <Chip size="small" color="success" variant="outlined" label="Виконано" />
  if (task.overdue) return <Chip size="small" color="warning" label="Прострочено" />
  return null
}

const isCountedAssignee = (a: GivenTaskAssignee) => a.isActive && isStaffTaskRole(a.role)

const assigneeNote = (a: GivenTaskAssignee) => {
  if (!isStaffTaskRole(a.role)) return ' (не працівник)'
  return a.isActive ? '' : ' (неактивний)'
}

const AssigneeList = ({ task }: { task: GivenTask }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    {task.assignees.map((a) => (
      <Box
        key={a.id}
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          py: 0.75,
          borderTop: 1,
          borderColor: 'divider',
          color: isCountedAssignee(a) ? 'text.primary' : 'text.disabled',
        }}
      >
        <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', color: 'inherit' }}>
          {a.lastName} {a.firstName}
          {assigneeNote(a)}
        </Typography>
        {a.doneAt ? (
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isCountedAssignee(a) ? 'success.main' : 'inherit', flexShrink: 0 }}>
            <CheckIcon fontSize="small" />
            {formatTaskMoment(a.doneAt)}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: isCountedAssignee(a) ? 'text.secondary' : 'inherit', flexShrink: 0 }}>
            не виконав
          </Typography>
        )}
      </Box>
    ))}
  </Box>
)

export const GivenTasksTab = () => {
  const profile = useAuthStore((s) => s.profile)
  const given = useTasksStore((s) => s.given)
  const givenNext = useTasksStore((s) => s.givenNext)
  const givenLoaded = useTasksStore((s) => s.givenLoaded)
  const givenError = useTasksStore((s) => s.givenError)
  const givenAll = useTasksStore((s) => s.givenAll)
  const isLoadingMore = useTasksStore((s) => s.isLoadingMoreGiven)
  const loadGiven = useTasksStore((s) => s.loadGiven)
  const loadMoreGiven = useTasksStore((s) => s.loadMoreGiven)
  const setGivenAll = useTasksStore((s) => s.setGivenAll)
  const cancelTask = useTasksStore((s) => s.cancelTask)
  const setTaskDialog = useTasksStore((s) => s.setTaskDialog)
  const isPhone = useIsPhone()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toCancel, setToCancel] = useState<GivenTask | null>(null)
  const isRoot = profile?.role === 'root'

  useEffect(() => {
    loadGiven().catch(() => undefined)
  }, [givenAll, loadGiven])

  const toggle = (id: string) => setExpanded((current) => (current === id ? null : id))

  const actions = (task: GivenTask) =>
    task.cancelledAt ? null : (
      <>
        {task.author.id === profile?.id && (
          <Tooltip title="Редагувати">
            <IconButton size={isPhone ? 'medium' : 'small'} onClick={() => setTaskDialog({ isOpen: true, task })}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Скасувати завдання">
          <IconButton size={isPhone ? 'medium' : 'small'} color="error" onClick={() => setToCancel(task)}>
            <BlockIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    )

  const progress = (task: GivenTask) => `${task.done} з ${task.total}`
  const authorName = (task: GivenTask) => `${task.author.lastName} ${task.author.firstName}`

  const body = () => {
    if (givenError) {
      return (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadGiven().catch(() => undefined)}>Спробувати ще</Button>}>
          Не вдалося завантажити завдання.
        </Alert>
      )
    }
    if (!givenLoaded) return <Typography color="text.secondary">Завантаження…</Typography>

    if (isPhone) {
      return (
        <CardList
          items={given}
          getKey={(t) => t.id}
          empty={<Typography color="text.secondary">Завдань ще немає.</Typography>}
          renderCard={(task) => (
            <Box sx={{ opacity: task.cancelledAt ? 0.7 : 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 800, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{task.title}</Typography>
                <StateChip task={task} />
              </Box>
              {task.description && (
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {task.description}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                до {formatTaskMoment(task.dueAt)} · виконали {progress(task)}
                {givenAll && ` · ${authorName(task)}`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Button
                  size="small"
                  color="inherit"
                  endIcon={expanded === task.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  onClick={() => toggle(task.id)}
                >
                  Виконавці
                </Button>
                <Box sx={{ flex: 1 }} />
                {actions(task)}
              </Box>
              <Collapse in={expanded === task.id} unmountOnExit>
                <Box sx={{ mt: 1 }}>
                  <AssigneeList task={task} />
                </Box>
              </Collapse>
            </Box>
          )}
        />
      )
    }

    return (
      <Paper elevation={0} variant="outlined">
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell>Завдання</TableCell>
                {givenAll && <TableCell>Автор</TableCell>}
                <TableCell>Термін</TableCell>
                <TableCell>Виконали</TableCell>
                <TableCell>Стан</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {given.length === 0 && (
                <TableRow>
                  <TableCell colSpan={givenAll ? 7 : 6} sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    Завдань ще немає.
                  </TableCell>
                </TableRow>
              )}
              {given.map((task) => (
                <Fragment key={task.id}>
                  <TableRow hover sx={{ opacity: task.cancelledAt ? 0.7 : 1, '& > td': { borderBottom: expanded === task.id ? 0 : undefined } }}>
                    <TableCell>
                      <IconButton size="small" aria-label="Виконавці" onClick={() => toggle(task.id)}>
                        {expanded === task.id ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{task.title}</Typography>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                          {task.description}
                        </Typography>
                      )}
                    </TableCell>
                    {givenAll && <TableCell>{authorName(task)}</TableCell>}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTaskMoment(task.dueAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{progress(task)}</TableCell>
                    <TableCell><StateChip task={task} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{actions(task)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={givenAll ? 7 : 6} sx={{ py: 0, borderBottom: expanded === task.id ? undefined : 0 }}>
                      <Collapse in={expanded === task.id} unmountOnExit>
                        <Box sx={{ pb: 1.5, pl: 6, maxWidth: 640 }}>
                          <AssigneeList task={task} />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography color="text.secondary">Завдань: {given.length}</Typography>
        {isRoot && (
          <FormControlLabel
            control={<Switch checked={givenAll} onChange={(e) => setGivenAll(e.target.checked)} />}
            label="Усі завдання"
          />
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setTaskDialog({ isOpen: true, task: null })}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Нове завдання
        </Button>
      </Box>
      {body()}
      {givenLoaded && givenNext && (
        <Box sx={{ mt: 1.5 }}>
          <Button onClick={() => loadMoreGiven().catch(() => undefined)} disabled={isLoadingMore}>
            Показати раніше
          </Button>
        </Box>
      )}
      <TaskDialog />
      <ConfirmDialog
        open={toCancel !== null}
        title="Скасувати завдання?"
        text={toCancel ? `«${toCancel.title}» буде скасовано для всіх виконавців.` : undefined}
        confirmLabel="Скасувати завдання"
        cancelLabel="Назад"
        onConfirm={() => (toCancel ? cancelTask(toCancel.id) : undefined)}
        onClose={() => setToCancel(null)}
      />
    </Box>
  )
}
