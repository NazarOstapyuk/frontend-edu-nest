import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { formatDay, type RoutineDay, type RoutineItem } from '../../../shared/api'
import { useRoutineStore } from '../model/routineStore'
import { RoutineItemsEditor } from './RoutineItemsEditor'

const validate = (items: RoutineItem[]): string | null => {
  if (items.length > 60) return 'Забагато пунктів'
  for (const item of items) {
    if (!item.startTime || !item.endTime || !item.title.trim()) return 'Заповніть час і назву кожного пункту'
    if (item.endTime <= item.startTime) return 'Кінець має бути пізніше за початок'
  }
  return null
}

const DayOverrideForm = ({ day, onClose }: { day: RoutineDay; onClose: () => void }) => {
  const isSaving = useRoutineStore((s) => s.isSaving)
  const saveDay = useRoutineStore((s) => s.saveDay)
  const resetDay = useRoutineStore((s) => s.resetDay)
  const [items, setItems] = useState<RoutineItem[]>(() => day.items.map((i) => ({ ...i })))
  const [note, setNote] = useState(day.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const onSave = async () => {
    const problem = validate(items)
    setError(problem)
    if (problem) return
    try {
      await saveDay(day.date, {
        note: note.trim() || undefined,
        items: items.map((i) => ({ ...i, title: i.title.trim() })),
      })
      onClose()
    } catch {
      return
    }
  }

  const onReset = async () => {
    try {
      await resetDay(day.date)
      onClose()
    } catch {
      return
    }
  }

  return (
    <>
      <DialogTitle>Розпорядок на {formatDay(day.date)}</DialogTitle>
      <DialogContent>
        <TextField
          size="small"
          fullWidth
          multiline
          label="Примітка"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          sx={{ mt: 1, mb: 2 }}
        />
        <RoutineItemsEditor value={items} onChange={setItems} error={error} />
      </DialogContent>
      <DialogActions>
        {day.source === 'override' && (
          <Button color="inherit" disabled={isSaving} onClick={onReset} sx={{ mr: 'auto' }}>
            Скинути до шаблону
          </Button>
        )}
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving} onClick={onSave}>Зберегти</Button>
      </DialogActions>
    </>
  )
}

export const DayOverrideDialog = () => {
  const { isOpen, day } = useRoutineStore((s) => s.dayDialog)
  const setDayDialog = useRoutineStore((s) => s.setDayDialog)
  const close = () => setDayDialog({ isOpen: false })

  return (
    <Dialog open={isOpen} onClose={close} fullWidth maxWidth="md">
      {day && <DayOverrideForm day={day} onClose={close} />}
    </Dialog>
  )
}
