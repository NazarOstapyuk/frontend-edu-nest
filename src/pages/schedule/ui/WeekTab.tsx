import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Chip, IconButton, Paper, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useScheduleStore } from '../model/scheduleStore'
import { ChangeDialog } from './ChangeDialog'
import { useCan } from '../../../entities/user'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { addDaysIso, formatDay, weekdayLabels, type ScheduleSlot } from '../../../shared/api'

type Action =
  | { kind: 'cancel' | 'replace'; date: string; slot: ScheduleSlot }
  | { kind: 'void'; date: string; slot: ScheduleSlot }
  | { kind: 'extra'; date: string }

export const WeekTab = () => {
  const navigate = useNavigate()
  const canEdit = useCan('timetable', 'edit')
  const classId = useScheduleStore((s) => s.classId)
  const classKey = useScheduleStore((s) => s.classKey)
  const week = useScheduleStore((s) => s.week)
  const weekData = useScheduleStore((s) => s.weekData)
  const weekFailed = useScheduleStore((s) => s.weekFailed)
  const isSaving = useScheduleStore((s) => s.isSaving)
  const setWeek = useScheduleStore((s) => s.setWeek)
  const loadWeek = useScheduleStore((s) => s.loadWeek)
  const createChange = useScheduleStore((s) => s.createChange)
  const voidChange = useScheduleStore((s) => s.voidChange)
  const [action, setAction] = useState<Action | null>(null)

  useEffect(() => {
    if (classId) loadWeek().catch(() => undefined)
  }, [classId, classKey, week, loadWeek])

  const openLesson = (date: string, slot: ScheduleSlot) =>
    navigate(`/lessons/${classId}/${date}/${slot.period}${slot.subgroupId ? `?subgroupId=${slot.subgroupId}` : ''}`)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => setWeek(addDaysIso(week, -7))}><ChevronLeftIcon /></IconButton>
        <Typography sx={{ minWidth: 200, textAlign: 'center' }}>{formatDay(week)} – {formatDay(addDaysIso(week, 5))}</Typography>
        <IconButton onClick={() => setWeek(addDaysIso(week, 7))}><ChevronRightIcon /></IconButton>
      </Box>
      {weekFailed ? (
        <Alert severity="error" action={<Button onClick={() => loadWeek().catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : !weekData ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.5 }}>
          {weekData.days.map((d, i) => (
            <Paper key={d.date} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Typography sx={{ fontWeight: 700 }}>{weekdayLabels[i]} {formatDay(d.date)}</Typography>
              {!d.working && <Typography variant="body2" color="text.secondary">Неробочий день{d.title ? `: ${d.title}` : ''}</Typography>}
              {d.slots.map((s, j) => (
                <Box key={j} sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: 'grey.50', opacity: s.cancelled ? 0.6 : 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: s.cancelled ? 'line-through' : 'none', cursor: s.cancelled ? 'default' : 'pointer' }} onClick={() => !s.cancelled && openLesson(d.date, s)}>
                    {s.period}. {s.subjectName}{s.subgroupName ? ` (${s.subgroupName})` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>{s.startTime}–{s.endTime}, {s.teacherName}{s.roomName ? `, ${s.roomName}` : ''}</Typography>
                  {s.source === 'replace' && <Chip size="small" color="warning" label="Заміна" sx={{ mr: 0.5 }} />}
                  {s.source === 'extra' && <Chip size="small" color="info" label="Додатковий" sx={{ mr: 0.5 }} />}
                  {s.lessonId && <Chip size="small" color="success" variant="outlined" label="Проведено" />}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {canEdit && !s.cancelled && <Button size="small" onClick={() => setAction({ kind: 'replace', date: d.date, slot: s })}>Заміна</Button>}
                    {canEdit && !s.cancelled && s.source === 'timetable' && <Button size="small" color="error" onClick={() => setAction({ kind: 'cancel', date: d.date, slot: s })}>Скасувати</Button>}
                    {canEdit && s.changeId && <Button size="small" onClick={() => setAction({ kind: 'void', date: d.date, slot: s })}>Відмінити зміну</Button>}
                  </Box>
                </Box>
              ))}
              {canEdit && d.working && <Button size="small" sx={{ mt: 1 }} onClick={() => setAction({ kind: 'extra', date: d.date })}>Додатковий урок</Button>}
            </Paper>
          ))}
        </Box>
      )}
      {action && (action.kind === 'replace' || action.kind === 'extra') && (
        <ChangeDialog mode={action.kind} date={action.date} slot={action.kind === 'replace' ? action.slot : null} onClose={() => setAction(null)} />
      )}
      <ReasonDialog
        open={action?.kind === 'cancel' || action?.kind === 'void'}
        title={action?.kind === 'void' ? 'Відмінити зміну' : 'Скасувати урок'}
        subtitle={action && action.kind !== 'extra' ? `${formatDay(action.date)}, ${action.slot.period}-й урок` : undefined}
        confirmLabel="Підтвердити"
        isSaving={isSaving}
        onClose={() => setAction(null)}
        onSubmit={async (reason) => {
          if (!action || action.kind === 'extra' || action.kind === 'replace') return
          if (action.kind === 'void' && action.slot.changeId) await voidChange(action.slot.changeId, reason)
          if (action.kind === 'cancel') {
            await createChange({ date: action.date, period: action.slot.period, subgroupId: action.slot.subgroupId ?? undefined, type: 'cancel', reason })
          }
          setAction(null)
        }}
      />
    </Box>
  )
}
