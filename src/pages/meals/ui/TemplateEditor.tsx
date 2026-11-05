import { useState } from 'react'
import { Box, Button, ButtonBase, Dialog, DialogTitle, IconButton, Paper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useMealsStore } from '../model/mealsStore'
import { DishPicker } from './DishPicker'
import { TemplateDayCard } from './TemplateDayCard'
import { AvailabilityList, CourseDayTable, type CourseTableColumn } from './CourseDayTable'
import { courseRowsFor, groupDishesByCourse } from '../model/dayDishes'
import { availabilityFor, itemsSignature, weekdayNames, weekdayShortNames } from '../model/menuDay'
import { useCan } from '../../../entities/user'
import { brandColors } from '../../../shared/assets/brand'
import type { MenuTemplate } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

type Item = { week: number; weekday: number; dishId: string }

const WORKDAYS = [1, 2, 3, 4, 5]
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

const toItems = (template: MenuTemplate): Item[] => template.items.map(({ week, weekday, dishId }) => ({ week, weekday, dishId }))

interface TemplateEditorProps {
  template: MenuTemplate
  week: number
  onWeekChange: (week: number) => void
}

export const TemplateEditor = ({ template, week, onWeekChange }: TemplateEditorProps) => {
  const isPhone = useIsPhone()
  const canEdit = useCan('meals', 'edit')
  const dishes = useMealsStore((s) => s.dishes)
  const courses = useMealsStore((s) => s.courses)
  const complexes = useMealsStore((s) => s.complexes)
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveTemplateItems = useMealsStore((s) => s.saveTemplateItems)
  const [items, setItems] = useState<Item[]>(toItems(template))
  const [cell, setCell] = useState<{ week: number; weekday: number } | null>(null)
  const [cellDishes, setCellDishes] = useState<string[]>([])
  const dirty = itemsSignature(items) !== itemsSignature(toItems(template))
  const dishById = new Map(dishes.map((d) => [d.id, d]))
  const weeks = Array.from({ length: template.weeks }, (_, w) => w + 1)
  const at = (w: number, weekday: number) => items.filter((i) => i.week === w && i.weekday === weekday)

  const dayDishes = (w: number, weekday: number) =>
    at(w, weekday).flatMap((i) => {
      const dish = dishById.get(i.dishId)
      return dish ? [{ name: dish.name, course: dish.course }] : []
    })

  const openCell = (w: number, weekday: number) => {
    setCell({ week: w, weekday })
    setCellDishes(at(w, weekday).map((i) => i.dishId))
  }

  const applyCell = () => {
    if (!cell) return
    setItems([
      ...items.filter((i) => !(i.week === cell.week && i.weekday === cell.weekday)),
      ...cellDishes.map((dishId) => ({ ...cell, dishId })),
    ])
    setCell(null)
  }

  const copySource = (weekday: number) => weeks.find((w) => w !== week && at(w, weekday).length > 0) ?? null

  const copyDay = (from: number, weekday: number) =>
    setItems([
      ...items.filter((i) => !(i.week === week && i.weekday === weekday)),
      ...at(from, weekday).map((i) => ({ ...i, week })),
    ])

  const copyLabel = (from: number, weekday: number) => `Як ${weekdayNames[weekday - 1].toLowerCase()} ${from}-го тижня`

  const activeComplexes = complexes.filter((c) => c.active)
  const courseRows = courseRowsFor(
    [...items.flatMap((i) => dishById.get(i.dishId)?.course ?? []), ...activeComplexes.flatMap((c) => c.courses)],
    courses,
  )

  const columns: CourseTableColumn[] = []
  const pendingOff: number[] = []
  const flushOff = () => {
    if (pendingOff.length === 0) return
    const days = [...pendingOff]
    pendingOff.length = 0
    columns.push({
      key: `off-${days[0]}`,
      type: 'off',
      content: (
        <>
          {days.map((d) => (
            <Box key={d} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{weekdayShortNames[d - 1]}</Typography>
              {canEdit && (
                <IconButton size="small" aria-label={`Додати страви: ${weekdayNames[d - 1].toLowerCase()}`} onClick={() => openCell(week, d)} sx={{ width: 36, height: 36 }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          <Typography sx={{ fontSize: 12, fontWeight: 700, writingMode: 'vertical-rl', transform: 'rotate(180deg)', mt: 1 }}>
            {days.length > 1 ? 'вихідні' : 'вихідний'}
          </Typography>
        </>
      ),
    })
  }
  for (const d of ALL_DAYS) {
    const list = dayDishes(week, d)
    if (d > 5 && list.length === 0) {
      pendingOff.push(d)
      continue
    }
    flushOff()
    const name = weekdayNames[d - 1]
    const source = copySource(d)
    columns.push({
      key: String(d),
      type: 'day',
      header: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 900, flex: 1 }}>{name}</Typography>
          {canEdit && (
            <IconButton aria-label={`Змінити страви: ${name.toLowerCase()}`} onClick={() => openCell(week, d)} sx={{ width: 36, height: 36, my: -0.5, mr: -0.75, color: 'text.secondary' }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
      dishes: list.map((x) => ({ name: x.name, courseId: x.course.id })),
      empty: (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>День порожній</Typography>
          {canEdit && (
            <Button variant="contained" size="small" onClick={() => openCell(week, d)}>Додати страви</Button>
          )}
          {canEdit && source !== null && (
            <Button size="small" onClick={() => copyDay(source, d)} sx={{ fontSize: 13 }}>{copyLabel(source, d)}</Button>
          )}
        </>
      ),
      onAdd: canEdit ? () => openCell(week, d) : undefined,
      footer: list.length > 0
        ? <AvailabilityList items={availabilityFor(list.map((x) => x.course.id), complexes)} />
        : <Typography variant="body2" color="text.secondary">страв ще немає</Typography>,
    })
  }
  flushOff()

  return (
    <Box>
      <Box role="tablist" aria-label="Тижні шаблону" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.75 }}>
        {weeks.map((w) => {
          const filled = WORKDAYS.filter((d) => at(w, d).length > 0).length
          const complete = filled === WORKDAYS.length
          const selected = w === week
          return (
            <ButtonBase
              key={w}
              role="tab"
              aria-selected={selected}
              onClick={() => onWeekChange(w)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                height: 44,
                px: 2,
                borderRadius: 1.5,
                fontSize: 14,
                fontWeight: 800,
                bgcolor: selected ? 'text.primary' : 'background.paper',
                color: selected ? 'background.paper' : 'text.secondary',
                boxShadow: selected ? 'none' : brandColors.outline,
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            >
              Тиждень {w}
              <Box
                component="span"
                sx={{
                  fontSize: 12,
                  borderRadius: 1,
                  px: 0.9,
                  py: 0.25,
                  bgcolor: complete ? brandColors.paidBg : 'primary.light',
                  color: complete ? brandColors.paidText : brandColors.inkOnOrange,
                }}
              >
                {filled} з {WORKDAYS.length}
              </Box>
            </ButtonBase>
          )
        })}
      </Box>

      {isPhone ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {ALL_DAYS.map((d) => {
            const list = dayDishes(week, d)
            const source = copySource(d)
            return (
              <TemplateDayCard
                key={d}
                weekdayIndex={d - 1}
                rows={groupDishesByCourse(list)}
                courseIds={list.map((x) => x.course.id)}
                narrow={d > 5 && list.length === 0}
                canEdit={canEdit}
                complexes={complexes}
                copyLabel={source !== null ? copyLabel(source, d) : undefined}
                onCopy={source !== null ? () => copyDay(source, d) : undefined}
                onOpen={() => openCell(week, d)}
              />
            )
          })}
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <CourseDayTable courses={courseRows} columns={columns} addLabel={() => 'Додати'} />
        </Paper>
      )}

      {canEdit && dirty && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 16,
            zIndex: 2,
            mt: 2,
            mx: 'auto',
            maxWidth: 720,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: 'wrap',
            pl: 2.25,
            pr: 1.25,
            py: 1.25,
            borderRadius: 2,
            bgcolor: 'text.primary',
            color: 'background.paper',
            boxShadow: brandColors.floatShadow,
          }}
        >
          <Typography sx={{ flex: 1, minWidth: 160, fontSize: 14, fontWeight: 700 }}>Є незбережені зміни</Typography>
          <Button color="inherit" disabled={isSaving} onClick={() => setItems(toItems(template))} sx={{ opacity: 0.85 }}>
            Скасувати
          </Button>
          <Button variant="contained" disabled={isSaving} onClick={() => saveTemplateItems(template.id, items).catch(() => undefined)}>
            Зберегти шаблон
          </Button>
        </Box>
      )}

      <Dialog fullScreen={isPhone} open={cell !== null} fullWidth maxWidth="sm">
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
