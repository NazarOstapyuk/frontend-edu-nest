import { useEffect } from 'react'
import { Alert, Box, Button, IconButton, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useChildRoutineStore } from '../model/childRoutineStore'
import { addDaysIso, formatDay, kyivNow } from '../../../shared/api'
import { RoutineWeek } from '../../../widgets/routineDay'

export const RoutineTab = ({ childId }: { childId: string }) => {
  const week = useChildRoutineStore((s) => s.week)
  const key = useChildRoutineStore((s) => s.key)
  const data = useChildRoutineStore((s) => s.data)
  const loadFailed = useChildRoutineStore((s) => s.loadFailed)
  const load = useChildRoutineStore((s) => s.load)

  useEffect(() => {
    load(childId).catch(() => undefined)
  }, [childId, load])

  const current = key === `${childId}/${week}`
  const ready = current && data !== null

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => load(childId, addDaysIso(week, -7)).catch(() => undefined)}><ChevronLeftIcon /></IconButton>
        <Typography sx={{ minWidth: 200, textAlign: 'center' }}>{formatDay(week)} – {formatDay(addDaysIso(week, 6))}</Typography>
        <IconButton onClick={() => load(childId, addDaysIso(week, 7)).catch(() => undefined)}><ChevronRightIcon /></IconButton>
      </Box>
      {loadFailed && current ? (
        <Alert severity="error" action={<Button onClick={() => load(childId).catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : !ready ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : (
        <RoutineWeek days={data.days} today={kyivNow().date} />
      )}
    </Box>
  )
}
