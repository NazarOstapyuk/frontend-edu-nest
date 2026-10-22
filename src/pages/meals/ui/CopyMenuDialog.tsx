import { useState } from 'react'
import { Box, Button, Checkbox, Dialog, DialogTitle, FormControlLabel, TextField, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { InstitutionMultiSelect } from './InstitutionMultiSelect'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { addDaysIso } from '../../../shared/api'

export const CopyMenuDialog = ({ onClose }: { onClose: () => void }) => {
  const current = useMealsStore((s) => s.menuInstitutionId)
  const menuStart = useMealsStore((s) => s.menuStart)
  const menuWeeks = useMealsStore((s) => s.menuWeeks)
  const isSaving = useMealsStore((s) => s.isSaving)
  const copyMenu = useMealsStore((s) => s.copyMenu)
  const push = useNotifyStore((s) => s.push)
  const [fromStart, setFromStart] = useState(menuStart)
  const [fromEnd, setFromEnd] = useState(addDaysIso(menuStart, menuWeeks * 7 - 1))
  const [toStart, setToStart] = useState(addDaysIso(menuStart, menuWeeks * 7))
  const [overwrite, setOverwrite] = useState(false)
  const [institutionIds, setInstitutionIds] = useState<string[]>([current])
  const invalid = institutionIds.length === 0 || !fromStart || !fromEnd || !toStart || fromEnd < fromStart

  const submit = () =>
    copyMenu({ institutionIds, fromStart, fromEnd, toStart, overwrite })
      .then((r) => {
        push(`Створено: ${r.created}, перезаписано: ${r.overwritten}, пропущено: ${r.skipped}`, 'success')
        onClose()
      })
      .catch(() => undefined)

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Копіювати меню</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField type="date" label="Звідки: з" value={fromStart} onChange={(e) => setFromStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          <TextField type="date" label="по" value={fromEnd} onChange={(e) => setFromEnd(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Box>
        <TextField type="date" label="Куди: починаючи з" value={toStart} onChange={(e) => setToStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <InstitutionMultiSelect label="Для закладів" value={institutionIds} onChange={setInstitutionIds} currentId={current} />
        <FormControlLabel control={<Checkbox checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />} label="Перезаписати чернетки" />
        <Typography variant="body2" color="text.secondary">Створюються чернетки. Опубліковані дні й неробочі дні пропускаються.</Typography>
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={submit} variant="contained" disabled={isSaving || invalid} sx={{ width: '100%' }}>Копіювати</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
