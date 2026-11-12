import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Paper, Typography } from '@mui/material'
import {
  addDaysIso,
  formatDay,
  kyivNow,
  parentCabinetApi,
  type ParentNoteAnswer,
  type ParentNotesDay,
} from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'

const PAGE_DAYS = 7

const answerText = (answer: ParentNoteAnswer) => {
  if (answer.value === null) return '—'
  if (typeof answer.value === 'boolean') return answer.value ? 'Так' : 'Ні'
  if (typeof answer.value === 'number' && answer.type === 'percent') return `${answer.value}%`
  if (typeof answer.value === 'number') return answer.unit ? `${answer.value} ${answer.unit}` : String(answer.value)
  return answer.value
}

export const NotesTab = ({ childId }: { childId: string }) => {
  const [days, setDays] = useState<ParentNotesDay[]>([])
  const [oldest, setOldest] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isFailed, setIsFailed] = useState(false)

  const fetchRange = useCallback(
    (from: string, to: string, append: boolean) =>
      parentCabinetApi
        .getNotes(childId, from, to)
        .then(({ data }) => {
          setDays((current) => (append ? [...current, ...data.days] : data.days))
          setOldest(from)
        })
        .catch(() => setIsFailed(true))
        .finally(() => setIsLoading(false)),
    [childId],
  )

  const loadRange = (from: string, to: string, append: boolean) => {
    setIsLoading(true)
    setIsFailed(false)
    fetchRange(from, to, append)
  }

  useEffect(() => {
    const today = kyivNow().date
    fetchRange(addDaysIso(today, -(PAGE_DAYS - 1)), today, false)
  }, [fetchRange])

  const showEarlier = () => loadRange(addDaysIso(oldest, -PAGE_DAYS), addDaysIso(oldest, -1), true)

  return (
    <Box>
      {isFailed && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => (oldest && days.length > 0 ? showEarlier() : loadRange(addDaysIso(kyivNow().date, -(PAGE_DAYS - 1)), kyivNow().date, false))}
            >
              Спробувати ще
            </Button>
          }
        >
          Не вдалося завантажити дані.
        </Alert>
      )}
      {!isFailed && isLoading && days.length === 0 && <Typography color="text.secondary">Завантаження…</Typography>}
      {!isLoading && !isFailed && days.length === 0 && <Typography color="text.secondary" sx={{ mb: 2 }}>Нотаток ще немає</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {days.map((day) => (
          <Paper key={day.date} elevation={0} sx={{ borderRadius: '20px', boxShadow: brandColors.outline, p: { xs: 2, sm: 3 } }}>
            <Typography sx={{ fontWeight: 900, mb: 1.5 }}>{formatDay(day.date)}</Typography>
            {day.sets.map((set) => (
              <Box key={set.name} sx={{ '&:not(:last-of-type)': { mb: 2 } }}>
                <Typography sx={{ fontWeight: 800, mb: 0.5 }}>{set.name}</Typography>
                {set.answers.map((answer) => (
                  <Box
                    key={answer.question}
                    sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 2 }, py: 0.75, borderTop: `1px solid ${brandColors.hairline}` }}
                  >
                    <Typography color="text.secondary" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                      {answer.question}
                    </Typography>
                    <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 700, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                      {answerText(answer)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Paper>
        ))}
      </Box>
      {!isFailed && oldest !== '' && (
        <Button variant="outlined" onClick={showEarlier} disabled={isLoading} sx={{ mt: 2 }}>
          Показати раніше
        </Button>
      )}
    </Box>
  )
}
