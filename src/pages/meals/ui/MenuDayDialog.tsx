import { useEffect, useState } from 'react'
import { Alert, Box, Button, Dialog, DialogTitle, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useMealsStore } from '../model/mealsStore'
import { DishPicker } from './DishPicker'
import { InstitutionMultiSelect } from './InstitutionMultiSelect'
import { formatDay, mealsApi, menuStatusLabels, type MenuDayView } from '../../../shared/api'
import { useEffectiveInstitutions } from '../../../shared/model/institutionStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

export const MenuDayDialog = ({ day, onClose }: { day: MenuDayView; onClose: () => void }) => {
  const isPhone = useIsPhone()
  const isSaving = useMealsStore((s) => s.isSaving)
  const current = useMealsStore((s) => s.menuInstitutionId)
  const saveMenuDay = useMealsStore((s) => s.saveMenuDay)
  const deleteMenuDay = useMealsStore((s) => s.deleteMenuDay)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [selected, setSelected] = useState<string[]>(day.menu?.dishes.map((d) => d.id) ?? [])

  const [institutionIds, setInstitutionIds] = useState<string[]>([current])
  const institutions = useEffectiveInstitutions()
  const [others, setOthers] = useState<Record<string, string[] | null>>({})
  const missing = institutionIds.filter((id) => id !== current && !(id in others)).join(',')

  useEffect(() => {
    if (!missing) return
    missing.split(',').forEach((id) => {
      mealsApi
        .getMenuDays(id, day.date, day.date)
        .then(({ data }) => setOthers((o) => ({ ...o, [id]: data[0]?.menu?.dishes.map((d) => d.id) ?? null })))
        .catch(() => undefined)
    })
  }, [missing, day.date])

  const replaced = institutionIds.filter((id) => {
    const dishes = others[id]
    return id !== current && dishes && (dishes.length !== selected.length || dishes.some((d) => !selected.includes(d)))
  })

  const save = () => saveMenuDay(day.date, institutionIds, selected).then(onClose).catch(() => undefined)
  const remove = () => deleteMenuDay(day.date).then(onClose).catch(() => undefined)

  return (
    <Dialog
      fullScreen={isPhone}
      open
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
        Меню {formatDay(day.date)}{day.menu ? ` · ${menuStatusLabels[day.menu.status]}` : ''}
        <IconButton aria-label="Закрити" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        {day.menu && day.menu.activeOrders > 0 && (
          <Alert severity="info">Замовлень: {day.menu.activeOrders}. Замовлені страви прибрати не можна.</Alert>
        )}
        <DishPicker value={selected} onChange={setSelected} />
        <InstitutionMultiSelect label="Також для закладів" value={institutionIds} onChange={setInstitutionIds} currentId={current} lockCurrent />
        {replaced.length > 0 && (
          <Alert severity="warning">
            Буде замінено меню на цю дату: {replaced.map((id) => institutions.find((i) => i.id === id)?.name ?? id).join(', ')}.
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: '10px' }}>
          {day.menu?.status === 'draft' && (
            <Button color="error" onClick={() => setConfirmRemove(true)} disabled={isSaving} sx={{ width: '100%' }}>Видалити чернетку</Button>
          )}
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={save} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Зберегти</Button>
        </Box>
      </Box>
      <ConfirmDialog
        open={confirmRemove}
        title="Видалити чернетку меню?"
        onConfirm={remove}
        onClose={() => setConfirmRemove(false)}
      />
    </Dialog>
  )
}
