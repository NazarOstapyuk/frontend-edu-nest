import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Chip, Paper, TextField, Typography } from '@mui/material'
import { useMyLessonsStore } from '../model/myLessonsStore'

export const MyLessonsPage = () => {
  const navigate = useNavigate()
  const date = useMyLessonsStore((s) => s.date)
  const data = useMyLessonsStore((s) => s.data)
  const loadFailed = useMyLessonsStore((s) => s.loadFailed)
  const setDate = useMyLessonsStore((s) => s.setDate)
  const load = useMyLessonsStore((s) => s.load)

  useEffect(() => {
    load().catch(() => undefined)
  }, [date, load])

  return (
    <Box>
      <TextField size="small" type="date" label="Дата" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />
      {loadFailed ? (
        <Alert severity="error" action={<Button onClick={() => load().catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : !data || data.date !== date ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : data.lessons.length === 0 ? (
        <Typography color="text.secondary">Уроків на цей день немає.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.lessons.map((l) => (
            <Paper
              key={`${l.group.id}-${l.period}-${l.subgroupId ?? 'class'}`}
              elevation={0}
              onClick={() => navigate(`/lessons/${l.group.id}/${date}/${l.period}${l.subgroupId ? `?subgroupId=${l.subgroupId}` : ''}`)}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, cursor: 'pointer' }}
            >
              <Typography sx={{ fontWeight: 600 }}>{l.startTime}–{l.endTime} · {l.subjectName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {l.group.name}{l.subgroupName ? `, ${l.subgroupName}` : ''}{l.roomName ? `, каб. ${l.roomName}` : ''}
              </Typography>
              {l.source === 'replace' && <Chip size="small" color="warning" label="Заміна" sx={{ mr: 0.5, mt: 0.5 }} />}
              {l.source === 'extra' && <Chip size="small" color="info" label="Додатковий" sx={{ mr: 0.5, mt: 0.5 }} />}
              {l.lessonId && <Chip size="small" color="success" variant="outlined" label="Проведено" sx={{ mt: 0.5 }} />}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  )
}
