import { useEffect, useState } from 'react'
import { Box, Button, Chip, IconButton, Paper, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useChildAttendanceStore } from '../model/childAttendanceStore'
import { NoticeDialog } from './NoticeDialog'
import { VisitsTab } from './VisitsTab'
import { LessonsBlock } from './LessonsBlock'
import {
  dailyStatusLabels,
  dayStateLabels,
  formatDay,
  localToday,
  monthLabel,
  noticeStatusLabels,
  shiftMonth,
  type ChildRegisterMonth,
  type DayState,
  type Visit,
} from '../../../shared/api'

const stateColor: Record<DayState, string> = {
  present: 'success.light',
  absent: 'error.light',
  expected_absent: 'warning.light',
  unmarked: 'grey.200',
  non_working: 'grey.100',
}

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

const MonthGrid = ({ register }: { register: ChildRegisterMonth }) => {
  const today = localToday()
  const offset = (new Date(`${register.days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
      {weekdays.map((w) => (
        <Typography key={w} variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{w}</Typography>
      ))}
      {Array.from({ length: offset }, (_, i) => <Box key={`pad-${i}`} />)}
      {register.days.map((d) => (
        <Box
          key={d.date}
          title={`${dayStateLabels[d.state]}${d.reasonName ? `: ${d.reasonName}` : ''}${d.title ? ` (${d.title})` : ''}`}
          sx={{ bgcolor: d.state === 'unmarked' && d.date > today ? 'transparent' : stateColor[d.state], borderRadius: 1, py: 1, textAlign: 'center', fontSize: 14 }}
        >
          {Number(d.date.slice(8))}
        </Box>
      ))}
    </Box>
  )
}

export const AttendanceTab = ({ childId, visits }: { childId: string; visits: Visit[] }) => {
  const storeChildId = useChildAttendanceStore((s) => s.childId)
  const month = useChildAttendanceStore((s) => s.month)
  const register = useChildAttendanceStore((s) => s.register)
  const lessons = useChildAttendanceStore((s) => s.lessons)
  const notices = useChildAttendanceStore((s) => s.notices)
  const isSaving = useChildAttendanceStore((s) => s.isSaving)
  const loadFailed = useChildAttendanceStore((s) => s.loadFailed)
  const open = useChildAttendanceStore((s) => s.open)
  const setMonth = useChildAttendanceStore((s) => s.setMonth)
  const cancelNotice = useChildAttendanceStore((s) => s.cancelNotice)
  const [dialogOpen, setDialogOpen] = useState(false)
  const isPhone = useIsPhone()

  useEffect(() => {
    open(childId).catch(() => undefined)
  }, [childId, open])

  const ready = storeChildId === childId && register !== null
  const monthVisits = visits.filter((v) => v.date.slice(0, 7) === month)
  const absences = ready ? register.days.filter((d) => d.state === 'absent' || d.state === 'expected_absent') : []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <IconButton onClick={() => setMonth(shiftMonth(month, -1)).catch(() => undefined)}><ChevronLeftIcon /></IconButton>
        <Typography sx={{ minWidth: 140, textAlign: 'center', fontWeight: 600 }}>{monthLabel(month)}</Typography>
        <IconButton onClick={() => setMonth(shiftMonth(month, 1)).catch(() => undefined)}><ChevronRightIcon /></IconButton>
        <Button variant="contained" sx={{ ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 40, sm: 'auto' } }} onClick={() => setDialogOpen(true)}>Повідомити про відсутність</Button>
      </Box>

      {!ready ? (
        loadFailed ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
            <Typography color="text.secondary">Не вдалося завантажити дані.</Typography>
            <Button variant="outlined" onClick={() => open(childId).catch(() => undefined)}>Спробувати ще</Button>
          </Box>
        ) : (
          <Typography color="text.secondary">Завантаження…</Typography>
        )
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip color="success" variant="outlined" label={`Присутній: ${register.summary.present} з ${register.summary.workingDays}`} />
            <Chip color="warning" variant="outlined" label={`Поважні пропуски: ${register.summary.absentExcused}`} />
            <Chip color="error" variant="outlined" label={`Без поважної причини: ${register.summary.absentUnexcused}`} />
            {register.summary.expectedAbsent > 0 && <Chip variant="outlined" label={`Очікується відсутність: ${register.summary.expectedAbsent}`} />}
          </Box>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
            <MonthGrid register={register} />
          </Paper>
          {lessons && <LessonsBlock lessons={lessons} />}
          {absences.length > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Пропуски</Typography>
              {absences.map((d) => (
                <Typography key={d.date} variant="body2">
                  {formatDay(d.date)}: {d.state === 'expected_absent' ? 'очікується відсутність' : d.status ? dailyStatusLabels[d.status] : ''}{d.reasonName ? `, ${d.reasonName}` : ''}
                </Typography>
              ))}
            </Paper>
          )}
        </>
      )}

      <Typography sx={{ fontWeight: 600 }}>Заняття та адаптація</Typography>
      <VisitsTab visits={monthVisits} />

      <Typography sx={{ fontWeight: 600 }}>Повідомлення про відсутність</Typography>
      {notices.length === 0 ? (
        <Typography color="text.secondary">Повідомлень ще немає.</Typography>
      ) : (
        notices.map((n) => (
          <Paper key={n.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ mr: 'auto' }}>
              <Typography>{formatDay(n.startDate)} – {formatDay(n.endDate)}, {n.reason.name}</Typography>
              {n.comment && <Typography variant="body2" color="text.secondary">{n.comment}</Typography>}
              {n.decisionReason && <Typography variant="body2" color="text.secondary">Причина рішення: {n.decisionReason}</Typography>}
            </Box>
            <Chip size="small" label={noticeStatusLabels[n.status]} color={n.status === 'approved' ? 'success' : n.status === 'rejected' ? 'error' : 'default'} />
            {n.status === 'pending' && (
              <Button size="small" color="error" disabled={isSaving} sx={{ minHeight: isPhone ? 40 : undefined }} onClick={() => cancelNotice(n.id).catch(() => undefined)}>Скасувати</Button>
            )}
          </Paper>
        ))
      )}

      <NoticeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  )
}
