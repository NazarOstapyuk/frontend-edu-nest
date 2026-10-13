import { useState } from 'react'
import { Box, Button, Checkbox, Dialog, DialogTitle, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { addDaysIso } from '../../../shared/api'

export const ApplyTemplateDialog = ({ onClose }: { onClose: () => void }) => {
  const templates = useMealsStore((s) => s.templates)
  const menuStart = useMealsStore((s) => s.menuStart)
  const menuWeeks = useMealsStore((s) => s.menuWeeks)
  const isSaving = useMealsStore((s) => s.isSaving)
  const applyTemplate = useMealsStore((s) => s.applyTemplate)
  const push = useNotifyStore((s) => s.push)
  const active = templates.filter((t) => t.active)
  const [templateId, setTemplateId] = useState(active[0]?.id ?? '')
  const [from, setFrom] = useState(menuStart)
  const [to, setTo] = useState(addDaysIso(menuStart, menuWeeks * 7 - 1))
  const [startWeek, setStartWeek] = useState(1)
  const [overwrite, setOverwrite] = useState(false)
  const template = active.find((t) => t.id === templateId)
  const invalid = !template || !from || !to || to < from || startWeek > template.weeks

  const submit = () =>
    applyTemplate(templateId, { from, to, startWeek, overwrite })
      .then((r) => {
        push(`Створено: ${r.created}, перезаписано: ${r.overwritten}, пропущено: ${r.skipped}`, 'success')
        onClose()
      })
      .catch(() => undefined)

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Застосувати шаблон</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        {active.length === 0 ? (
          <Typography color="text.secondary">Немає активних шаблонів.</Typography>
        ) : (
          <>
            <TextField select label="Шаблон" value={templateId} onChange={(e) => { setTemplateId(e.target.value); setStartWeek(1) }}>
              {active.map((t) => <MenuItem key={t.id} value={t.id}>{t.name} ({t.weeks} тиж.)</MenuItem>)}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField type="date" label="З" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
              <TextField type="date" label="По" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            </Box>
            <TextField select label="Почати з тижня циклу" value={startWeek} onChange={(e) => setStartWeek(Number(e.target.value))}>
              {Array.from({ length: template?.weeks ?? 1 }, (_, i) => i + 1).map((w) => <MenuItem key={w} value={w}>{w}</MenuItem>)}
            </TextField>
            <FormControlLabel control={<Checkbox checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />} label="Перезаписати чернетки" />
            <Typography variant="body2" color="text.secondary">Створюються чернетки. Опубліковані дні й неробочі дні пропускаються.</Typography>
          </>
        )}
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={submit} variant="contained" disabled={isSaving || invalid} sx={{ width: '100%' }}>Застосувати</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
