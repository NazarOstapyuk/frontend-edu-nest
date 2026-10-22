import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogTitle } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { DishPicker } from './DishPicker'
import { InstitutionMultiSelect } from './InstitutionMultiSelect'
import { formatDay, menuStatusLabels, type MenuDayView } from '../../../shared/api'

export const MenuDayDialog = ({ day, onClose }: { day: MenuDayView; onClose: () => void }) => {
  const isSaving = useMealsStore((s) => s.isSaving)
  const current = useMealsStore((s) => s.menuInstitutionId)
  const saveMenuDay = useMealsStore((s) => s.saveMenuDay)
  const deleteMenuDay = useMealsStore((s) => s.deleteMenuDay)
  const [selected, setSelected] = useState<string[]>(day.menu?.dishes.map((d) => d.id) ?? [])

  const [institutionIds, setInstitutionIds] = useState<string[]>([current])

  const save = () => saveMenuDay(day.date, institutionIds, selected).then(onClose).catch(() => undefined)
  const remove = () => deleteMenuDay(day.date).then(onClose).catch(() => undefined)

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        Меню {formatDay(day.date)}{day.menu ? ` · ${menuStatusLabels[day.menu.status]}` : ''}
      </DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        {day.menu && day.menu.activeOrders > 0 && (
          <Alert severity="info">Замовлень: {day.menu.activeOrders}. Замовлені страви прибрати не можна.</Alert>
        )}
        <DishPicker value={selected} onChange={setSelected} />
        <InstitutionMultiSelect label="Також для закладів" value={institutionIds} onChange={setInstitutionIds} currentId={current} lockCurrent />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          {day.menu?.status === 'draft' && (
            <Button color="error" onClick={remove} disabled={isSaving} sx={{ width: '100%' }}>Видалити чернетку</Button>
          )}
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={save} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Зберегти</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
