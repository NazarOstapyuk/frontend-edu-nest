import { useEffect } from 'react'
import { Alert, Box, Button, Chip, IconButton, Paper, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useChildScheduleStore } from '../model/childScheduleStore'
import { addDaysIso, formatDay, weekdayLabels } from '../../../shared/api'

export const ScheduleTab = ({ childId }: { childId: string }) => {
  const week = useChildScheduleStore((s) => s.week)
  const key = useChildScheduleStore((s) => s.key)
  const data = useChildScheduleStore((s) => s.data)
  const loadFailed = useChildScheduleStore((s) => s.loadFailed)
  const load = useChildScheduleStore((s) => s.load)

  useEffect(() => {
    load(childId).catch(() => undefined)
  }, [childId, load])

  const ready = key === `${childId}/${week}` && data !== null

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => load(childId, addDaysIso(week, -7)).catch(() => undefined)}><ChevronLeftIcon /></IconButton>
        <Typography sx={{ minWidth: 200, textAlign: 'center' }}>{formatDay(week)} – {formatDay(addDaysIso(week, 5))}</Typography>
        <IconButton onClick={() => load(childId, addDaysIso(week, 7)).catch(() => undefined)}><ChevronRightIcon /></IconButton>
      </Box>
      {loadFailed && key === `${childId}/${week}` ? (
        <Alert severity="error" action={<Button onClick={() => load(childId).catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : !ready ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : data.days.length === 0 ? (
        <Typography color="text.secondary">Розкладу немає.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.days.map((d, i) => (
            <Paper key={d.date} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Typography sx={{ fontWeight: 700 }}>{weekdayLabels[i]} {formatDay(d.date)}</Typography>
              {!d.working && <Typography variant="body2" color="text.secondary">Неробочий день{d.title ? `: ${d.title}` : ''}</Typography>}
              {d.working && d.slots.length === 0 && <Typography variant="body2" color="text.secondary">Уроків немає.</Typography>}
              {d.slots.map((s, j) => (
                <Box key={j} sx={{ mt: 1, opacity: s.cancelled ? 0.6 : 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: s.cancelled ? 'line-through' : 'none' }}>
                    {s.startTime} {s.subjectName}{s.subgroupName ? ` (${s.subgroupName})` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{s.teacherName}{s.roomName ? `, каб. ${s.roomName}` : ''}</Typography>
                  {s.replaced && <Chip size="small" color="warning" label="Заміна" sx={{ ml: 1 }} />}
                  {s.cancelled && <Chip size="small" label="Скасовано" sx={{ ml: 1 }} />}
                  {s.topic && <Typography variant="body2">Тема: {s.topic}</Typography>}
                  {s.homework && <Typography variant="body2">Домашнє завдання: {s.homework}</Typography>}
                </Box>
              ))}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  )
}
