import { useEffect } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { formatTaskMoment, myTaskStatusLabels, type MyTask } from '../../../shared/api'
import { useTasksStore } from '../model/tasksStore'

const StatusChip = ({ task }: { task: MyTask }) => {
  if (task.status === 'overdue') return <Chip size="small" color="warning" label={myTaskStatusLabels.overdue} />
  if (task.status === 'done') return <Chip size="small" color="success" variant="outlined" label={myTaskStatusLabels.done} />
  if (task.status === 'cancelled') return <Chip size="small" variant="outlined" label={myTaskStatusLabels.cancelled} />
  return null
}

const TaskCard = ({ task }: { task: MyTask }) => {
  const markingId = useTasksStore((s) => s.markingId)
  const markDone = useTasksStore((s) => s.markDone)
  const markUndone = useTasksStore((s) => s.markUndone)
  const busy = markingId === task.id
  const closed = task.status === 'done' || task.status === 'cancelled'

  return (
    <Card variant="outlined" sx={{ opacity: task.status === 'cancelled' ? 0.7 : 1 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 800, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{task.title}</Typography>
          <StatusChip task={task} />
        </Box>
        {task.description && (
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {task.description}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          до {formatTaskMoment(task.dueAt)} · {task.author.lastName} {task.author.firstName}
          {task.doneAt && ` · виконано ${formatTaskMoment(task.doneAt)}`}
        </Typography>
        {task.status !== 'cancelled' && (
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-start' } }}>
            {closed ? (
              <Button
                variant="outlined"
                size="small"
                disabled={busy}
                onClick={() => markUndone(task.id).catch(() => undefined)}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Скасувати відмітку
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckIcon />}
                disabled={busy}
                onClick={() => markDone(task.id).catch(() => undefined)}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Виконано
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export const MyTasksTab = () => {
  const mine = useTasksStore((s) => s.mine)
  const mineNext = useTasksStore((s) => s.mineNext)
  const mineLoaded = useTasksStore((s) => s.mineLoaded)
  const mineError = useTasksStore((s) => s.mineError)
  const isLoadingMore = useTasksStore((s) => s.isLoadingMoreMine)
  const loadMine = useTasksStore((s) => s.loadMine)
  const loadMoreMine = useTasksStore((s) => s.loadMoreMine)

  useEffect(() => {
    loadMine().catch(() => undefined)
  }, [loadMine])

  if (mineError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadMine().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити завдання.
      </Alert>
    )
  }

  if (!mineLoaded) return <Typography color="text.secondary">Завантаження…</Typography>

  const open = mine.filter((t) => t.status === 'open' || t.status === 'overdue')
  const history = mine.filter((t) => t.status === 'done' || t.status === 'cancelled')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {open.length === 0 && (
        <Typography color="text.secondary">Відкритих завдань немає.</Typography>
      )}
      {open.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      {history.length > 0 && (
        <Typography sx={{ fontWeight: 800, mt: 1 }}>Історія</Typography>
      )}
      {history.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      {mineNext && (
        <Box>
          <Button onClick={() => loadMoreMine().catch(() => undefined)} disabled={isLoadingMore}>
            Показати раніше
          </Button>
        </Box>
      )}
    </Box>
  )
}
