import { useState } from 'react'
import { Box, Button, Dialog, DialogTitle, IconButton, Paper, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useMealsStore } from '../model/mealsStore'
import { DishPicker } from './DishPicker'
import { useCan } from '../../../entities/user'
import { isoWeekdayLabels, type MenuTemplate } from '../../../shared/api'

type Item = { week: number; weekday: number; dishId: string }

export const TemplateEditor = ({ template }: { template: MenuTemplate }) => {
  const canEdit = useCan('meals', 'edit')
  const dishes = useMealsStore((s) => s.dishes)
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveTemplateItems = useMealsStore((s) => s.saveTemplateItems)
  const [items, setItems] = useState<Item[]>(template.items.map(({ week, weekday, dishId }) => ({ week, weekday, dishId })))
  const [cell, setCell] = useState<{ week: number; weekday: number } | null>(null)
  const [cellDishes, setCellDishes] = useState<string[]>([])
  const dirty = JSON.stringify(items) !== JSON.stringify(template.items.map(({ week, weekday, dishId }) => ({ week, weekday, dishId })))
  const nameOf = (id: string) => dishes.find((d) => d.id === id)?.name ?? '—'
  const at = (week: number, weekday: number) => items.filter((i) => i.week === week && i.weekday === weekday)

  const openCell = (week: number, weekday: number) => {
    setCell({ week, weekday })
    setCellDishes(at(week, weekday).map((i) => i.dishId))
  }

  const applyCell = () => {
    if (!cell) return
    setItems([
      ...items.filter((i) => !(i.week === cell.week && i.weekday === cell.weekday)),
      ...cellDishes.map((dishId) => ({ ...cell, dishId })),
    ])
    setCell(null)
  }

  return (
    <Box>
      {Array.from({ length: template.weeks }, (_, w) => w + 1).map((week) => (
        <Box key={week} sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Тиждень {week}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))', gap: 1, overflowX: 'auto' }}>
            {isoWeekdayLabels.map((label, i) => (
              <Paper
                key={label}
                elevation={0}
                onClick={() => canEdit && openCell(week, i + 1)}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1, minHeight: 80, cursor: canEdit ? 'pointer' : 'default' }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
                {at(week, i + 1).map((item) => (
                  <Typography key={item.dishId} variant="caption" sx={{ display: 'block' }}>{nameOf(item.dishId)}</Typography>
                ))}
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
      {canEdit && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" disabled={!dirty || isSaving} onClick={() => saveTemplateItems(template.id, items).catch(() => undefined)}>
            Зберегти шаблон
          </Button>
        </Box>
      )}
      <Dialog
        open={cell !== null}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          Тиждень {cell?.week}, {cell ? isoWeekdayLabels[cell.weekday - 1] : ''}
          <IconButton aria-label="Закрити" onClick={() => setCell(null)} sx={{ position: 'absolute', right: 12, top: 12 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
          <DishPicker value={cellDishes} onChange={setCellDishes} />
          <Box sx={{ display: 'flex', gap: '10px' }}>
            <Button onClick={() => setCell(null)} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
            <Button onClick={applyCell} variant="contained" sx={{ width: '100%' }}>Готово</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
