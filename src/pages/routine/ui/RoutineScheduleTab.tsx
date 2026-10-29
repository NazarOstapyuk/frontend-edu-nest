import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useCan } from '../../../entities/user'
import { formatDay, kyivNow } from '../../../shared/api'
import { RoutineWeek } from '../../../widgets/routineDay'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useRoutineStore } from '../model/routineStore'

export const RoutineScheduleTab = () => {
  const isPhone = useIsPhone()
  const days = useRoutineStore((s) => s.days)
  const isLoading = useRoutineStore((s) => s.isLoading)
  const isSaving = useRoutineStore((s) => s.isSaving)
  const loadError = useRoutineStore((s) => s.loadError)
  const load = useRoutineStore((s) => s.load)
  const resetDay = useRoutineStore((s) => s.resetDay)
  const setDayDialog = useRoutineStore((s) => s.setDayDialog)
  const canEdit = useCan('timetable', 'edit')
  const [resetDate, setResetDate] = useState<string | null>(null)

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

  const confirmReset = async () => {
    if (!resetDate) return
    try {
      await resetDay(resetDate)
      setResetDate(null)
    } catch {
      return
    }
  }

  return (
    <>
      <RoutineWeek
        days={days}
        today={kyivNow().date}
        onEditDay={
          canEdit
            ? (date) => setDayDialog({ isOpen: true, day: days.find((d) => d.date === date) ?? null })
            : undefined
        }
        onResetDay={canEdit ? (date) => setResetDate(date) : undefined}
      />
      <Dialog open={resetDate !== null} onClose={() => setResetDate(null)} fullScreen={isPhone}>
        <DialogTitle>Скинути до шаблону?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Зміни для {resetDate ? formatDay(resetDate) : ''} буде видалено, діятиме розпорядок із шаблону.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDate(null)}>Скасувати</Button>
          <Button variant="contained" disabled={isSaving} onClick={confirmReset}>Скинути</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
