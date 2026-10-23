import { useEffect, useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { kyivNow, type RoutineDay } from '../../../shared/api'

interface RoutineWeekProps {
  days: RoutineDay[]
  today: string
  onEditDay?: (date: string) => void
  onResetDay?: (date: string) => void
}

const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

const weekdayIndex = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7

const chipLabel = (date: string) => `${dayLabels[weekdayIndex(date)]} ${date.slice(8, 10)}.${date.slice(5, 7)}`

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

export const RoutineWeek = ({ days, today, onEditDay, onResetDay }: RoutineWeekProps) => {
  const [chosen, setChosen] = useState<string | null>(null)
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(timer)
  }, [])
  const shown = onEditDay ? days : days.filter((d) => weekdayIndex(d.date) < 5 || d.items.length > 0)
  const fallback = shown.find((d) => d.date === today) ?? shown.find((d) => weekdayIndex(d.date) === 0) ?? shown[0]
  const selected = shown.find((d) => d.date === chosen) ?? fallback
  const now = kyivNow()
  const nowMinutes = now.minutes

  if (!selected) return <Typography color="text.secondary">Немає даних.</Typography>

  const isCurrent = (item: RoutineDay['items'][number]) =>
    selected.date === today && minutes(item.startTime) <= nowMinutes && nowMinutes < minutes(item.endTime)

  const hasActions = !!onEditDay || (!!onResetDay && selected.source === 'override')

  return (
    <Box>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
        {shown.map((d) => (
          <Chip
            key={d.date}
            label={chipLabel(d.date)}
            color={d.date === selected.date ? 'primary' : 'default'}
            variant={d.date === selected.date ? 'filled' : 'outlined'}
            onClick={() => setChosen(d.date)}
          />
        ))}
      </Stack>
      {(selected.source === 'override' || hasActions) && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
          {selected.source === 'override' && <Chip size="small" color="warning" label="Змінено для цього дня" />}
          {onEditDay && (
            <Button size="small" onClick={() => onEditDay(selected.date)}>Змінити цей день</Button>
          )}
          {onResetDay && selected.source === 'override' && (
            <Button size="small" color="inherit" onClick={() => onResetDay(selected.date)}>Скинути до шаблону</Button>
          )}
        </Stack>
      )}
      {!selected.working && (
        <Typography sx={{ fontWeight: 600, mb: 1 }}>
          Вихідний{selected.calendarTitle ? ` · ${selected.calendarTitle}` : ''}
        </Typography>
      )}
      {selected.working && selected.items.length === 0 && (
        <Typography color="text.secondary">Розпорядку на цей день немає.</Typography>
      )}
      {selected.items.length > 0 && (
        <Box>
          {selected.items.map((item, index) => {
            const current = isCurrent(item)
            return (
              <Box
                key={`${item.startTime}-${item.endTime}-${index}`}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  py: 0.75,
                  px: current ? 1 : 0,
                  borderBottom: 1,
                  borderColor: 'divider',
                  borderLeft: current ? 3 : 0,
                  borderLeftColor: 'primary.main',
                  bgcolor: current ? 'action.selected' : undefined,
                }}
              >
                <Typography sx={{ width: 110, flexShrink: 0, fontWeight: 600, color: current ? 'primary.main' : 'text.secondary' }}>
                  {item.startTime}–{item.endTime}
                </Typography>
                <Typography sx={{ fontWeight: current ? 600 : 400 }}>
                  {item.title}
                  {current && ' · зараз'}
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}
      {selected.workingHours && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Режим роботи: {selected.workingHours}
        </Typography>
      )}
      {selected.note && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
          {selected.note}
        </Typography>
      )}
    </Box>
  )
}
