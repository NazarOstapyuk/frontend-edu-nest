import { useState } from 'react'
import { Box, Button, Dialog, DialogTitle, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useMealsStore } from '../model/mealsStore'
import { DishPicker } from './DishPicker'
import { TemplateDayCard } from './TemplateDayCard'
import { groupDishesByCourse } from '../model/dayDishes'
import { weekdayNames } from '../model/menuDay'
import { useCan } from '../../../entities/user'
import type { MenuTemplate } from '../../../shared/api'

type Item = { week: number; weekday: number; dishId: string }

const WORKDAYS = [1, 2, 3, 4, 5]
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

const toItems = (template: MenuTemplate): Item[] => template.items.map(({ week, weekday, dishId }) => ({ week, weekday, dishId }))

export const TemplateEditor = ({ template }: { template: MenuTemplate }) => {
  const canEdit = useCan('meals', 'edit')
  const dishes = useMealsStore((s) => s.dishes)
  const courses = useMealsStore((s) => s.courses)
  const complexes = useMealsStore((s) => s.complexes)
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveTemplateItems = useMealsStore((s) => s.saveTemplateItems)
  const [items, setItems] = useState<Item[]>(toItems(template))
  const [cell, setCell] = useState<{ week: number; weekday: number } | null>(null)
  const [cellDishes, setCellDishes] = useState<string[]>([])
  const dirty = JSON.stringify(items) !== JSON.stringify(toItems(template))
  const dishById = new Map(dishes.map((d) => [d.id, d]))
  const courseById = new Map(courses.map((c) => [c.id, c]))
  const at = (week: number, weekday: number) => items.filter((i) => i.week === week && i.weekday === weekday)

  const dayDishes = (week: number, weekday: number) =>
    at(week, weekday).flatMap((i) => {
      const dish = dishById.get(i.dishId)
      const course = dish && courseById.get(dish.courseId)
      return dish && course ? [{ name: dish.name, course }] : []
    })

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
    <Box sx={{ pb: dirty ? 9 : 0 }}>
      {Array.from({ length: template.weeks }, (_, w) => w + 1).map((week) => {
        const filled = WORKDAYS.filter((d) => at(week, d).length > 0).length
        const columns = ALL_DAYS.map((d) => (d <= 5 || at(week, d).length > 0 ? 'minmax(180px, 1fr)' : '56px')).join(' ')
        return (
          <Box key={week} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1.25 }}>
              <Typography sx={{ fontWeight: 700 }}>Тиждень {week}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }} aria-label="Заповнені дні">
                {WORKDAYS.map((d) => (
                  <Tooltip key={d} title={`${weekdayNames[d - 1]}: ${at(week, d).length > 0 ? 'заповнено' : 'порожньо'}`}>
                    <Box sx={{ width: 28, height: 8, borderRadius: 4, bgcolor: at(week, d).length > 0 ? 'primary.light' : 'grey.300' }} />
                  </Tooltip>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Заповнено {filled} з {WORKDAYS.length} днів
              </Typography>
            </Box>
            <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 1.25, minWidth: 'min-content' }}>
                {ALL_DAYS.map((d) => {
                  const list = dayDishes(week, d)
                  return (
                    <TemplateDayCard
                      key={d}
                      weekdayIndex={d - 1}
                      rows={groupDishesByCourse(list)}
                      courseIds={list.map((x) => x.course.id)}
                      narrow={d > 5 && list.length === 0}
                      canEdit={canEdit}
                      complexes={complexes}
                      onOpen={() => openCell(week, d)}
                    />
                  )
                })}
              </Box>
            </Box>
          </Box>
        )
      })}

      {canEdit && dirty && (
        <Paper
          elevation={6}
          sx={{
            position: 'sticky',
            bottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            px: 2,
            py: 1.25,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Є незбережені зміни в шаблоні</Typography>
          <Box sx={{ flex: 1 }} />
          <Button color="inherit" disabled={isSaving} onClick={() => setItems(toItems(template))}>Скасувати зміни</Button>
          <Button variant="contained" disabled={isSaving} onClick={() => saveTemplateItems(template.id, items).catch(() => undefined)}>
            Зберегти шаблон
          </Button>
        </Paper>
      )}

      <Dialog open={cell !== null} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
          Тиждень {cell?.week}, {cell ? weekdayNames[cell.weekday - 1].toLowerCase() : ''}
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
