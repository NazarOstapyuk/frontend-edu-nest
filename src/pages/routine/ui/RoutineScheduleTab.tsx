import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { useCan } from '../../../entities/user'
import { localToday } from '../../../shared/api'
import { RoutineWeek } from '../../../widgets/routineDay'
import { useRoutineStore } from '../model/routineStore'

export const RoutineScheduleTab = () => {
  const days = useRoutineStore((s) => s.days)
  const isLoading = useRoutineStore((s) => s.isLoading)
  const loadError = useRoutineStore((s) => s.loadError)
  const load = useRoutineStore((s) => s.load)
  const resetDay = useRoutineStore((s) => s.resetDay)
  const setDayDialog = useRoutineStore((s) => s.setDayDialog)
  const canEdit = useCan('timetable', 'edit')

  if (loadError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => load().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }
  if (isLoading && days.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
  }

  return (
    <RoutineWeek
      days={days}
      today={localToday()}
      onEditDay={
        canEdit
          ? (date) => setDayDialog({ isOpen: true, day: days.find((d) => d.date === date) ?? null })
          : undefined
      }
      onResetDay={canEdit ? (date) => resetDay(date).catch(() => undefined) : undefined}
    />
  )
}
