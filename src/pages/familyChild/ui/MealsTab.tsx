import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, IconButton, MenuItem, Paper, TextField, Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useChildMealsStore } from '../model/childMealsStore'
import { addDaysIso, formatDay, isoWeekdayLabels, type ParentMenu, type ParentMenuDay } from '../../../shared/api'

type Selection = { complexId: string; picks: Record<string, string> }

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' })

const weekdayOf = (date: string) => isoWeekdayLabels[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]

const choiceCourses = (day: ParentMenuDay, complexId: string) =>
  (day.complexes.find((c) => c.id === complexId)?.courses ?? []).filter((c) => c.options.length > 1)

const isComplete = (day: ParentMenuDay, s: Selection | undefined) =>
  !!s && !!s.complexId && choiceCourses(day, s.complexId).every((c) => s.picks[c.id])

const issueTexts = {
  no_group: 'Дитина ще не в групі, харчування недоступне.',
  no_price_category: 'Для групи ще не налаштовано ціни харчування.',
}

const Week = ({ childId, data }: { childId: string; data: ParentMenu }) => {
  const isPhone = useIsPhone()
  const isSaving = useChildMealsStore((s) => s.isSaving)
  const order = useChildMealsStore((s) => s.order)
  const cancel = useChildMealsStore((s) => s.cancel)
  const [selection, setSelection] = useState<Record<string, Selection>>({})
  const selectionOf = (day: ParentMenuDay): Selection =>
    selection[day.date] ?? { complexId: day.complexes.length === 1 ? day.complexes[0].id : '', picks: {} }
  const update = (day: ParentMenuDay, patch: Partial<Selection>) =>
    setSelection((prev) => ({ ...prev, [day.date]: { ...selectionOf(day), ...patch } }))

  const orderable = data.days.filter((d) => d.canOrder)
  const chosen = orderable.filter((d) => selectionOf(d).complexId && isComplete(d, selectionOf(d)))
  const total = chosen.reduce((sum, d) => sum + Number(d.complexes.find((c) => c.id === selectionOf(d).complexId)?.price ?? 0), 0)
  const first = orderable.find((d) => selectionOf(d).complexId)

  const copyFirst = () => {
    if (!first) return
    const source = selectionOf(first)
    setSelection((prev) => {
      const next = { ...prev }
      for (const day of orderable) {
        if (day.date === first.date || !day.complexes.some((c) => c.id === source.complexId)) continue
        const picks: Record<string, string> = {}
        for (const course of choiceCourses(day, source.complexId)) {
          const pick = source.picks[course.id]
          if (pick && course.options.some((o) => o.id === pick)) picks[course.id] = pick
        }
        next[day.date] = { complexId: source.complexId, picks }
      }
      return next
    })
  }

  const submit = () =>
    order(
      childId,
      chosen.map((d) => {
        const s = selectionOf(d)
        return { date: d.date, complexId: s.complexId, dishIds: choiceCourses(d, s.complexId).map((c) => s.picks[c.id]) }
      }),
    )
      .then(() => setSelection({}))
      .catch(() => undefined)

  const issue = data.issue ? <Alert severity="info">{issueTexts[data.issue]}</Alert> : null

  if (data.days.length === 0)
    return issue ?? <Typography color="text.secondary">Меню на цей тиждень ще не опубліковано.</Typography>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {issue}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Замовити або скасувати можна до {data.deadline} у день харчування.</Typography>
        {orderable.length > 1 && (
          <Button size="small" disabled={!first} sx={{ minHeight: isPhone ? 40 : undefined }} onClick={copyFirst}>
            Як у першому дні
          </Button>
        )}
      </Box>
      {data.days.map((day) => {
        const s = selectionOf(day)
        const placed = day.order
        return (
          <Paper key={day.date} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 700 }}>{weekdayOf(day.date)} {formatDay(day.date)}</Typography>
              {!day.working && <Chip size="small" color="warning" label="Неробочий день" />}
              {day.open ? (
                <Chip size="small" label={`до ${timeOf(day.deadlineAt)}`} />
              ) : (
                <Chip size="small" label="Замовлення закрито" />
              )}
            </Box>
            {day.dishes.map((d) => (
              <Typography key={d.id} variant="body2">{d.course.name}: {d.name}</Typography>
            ))}
            {placed && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip color="success" label={`Замовлено: ${placed.complex.name}, ${placed.price} грн`} />
                <Typography variant="body2">{placed.items.map((i) => i.dishName).join(', ')}</Typography>
                {day.canCancel && (
                  <Button size="small" color="error" disabled={isSaving} sx={{ minHeight: isPhone ? 40 : undefined }} onClick={() => cancel(childId, placed.id).catch(() => undefined)}>
                    Скасувати
                  </Button>
                )}
              </Box>
            )}
            {day.canOrder && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField select size="small" label="Комплекс" value={s.complexId} onChange={(e) => update(day, { complexId: e.target.value, picks: {} })} sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                  <MenuItem value="">Не замовляти</MenuItem>
                  {day.complexes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} — {c.price} грн</MenuItem>)}
                </TextField>
                {s.complexId && choiceCourses(day, s.complexId).map((course) => (
                  <TextField
                    key={course.id}
                    select
                    size="small"
                    label={course.name}
                    value={s.picks[course.id] ?? ''}
                    onChange={(e) => update(day, { picks: { ...s.picks, [course.id]: e.target.value } })}
                    sx={{ minWidth: { xs: '100%', sm: 180 } }}
                  >
                    {course.options.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                  </TextField>
                ))}
              </Box>
            )}
          </Paper>
        )
      })}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-end', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        {chosen.length > 0 && <Typography>Днів: {chosen.length}, разом {total.toFixed(2)} грн</Typography>}
        <Button variant="contained" disabled={chosen.length === 0 || isSaving} sx={{ minHeight: isPhone ? 44 : undefined }} onClick={submit}>Замовити</Button>
      </Box>
    </Box>
  )
}

export const MealsTab = ({ childId }: { childId: string }) => {
  const week = useChildMealsStore((s) => s.week)
  const key = useChildMealsStore((s) => s.key)
  const data = useChildMealsStore((s) => s.data)
  const loadFailed = useChildMealsStore((s) => s.loadFailed)
  const load = useChildMealsStore((s) => s.load)

  useEffect(() => {
    load(childId).catch(() => undefined)
  }, [childId, load])

  const current = key === `${childId}/${week}`

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => load(childId, addDaysIso(week, -7)).catch(() => undefined)}><ChevronLeftIcon /></IconButton>
        <Typography sx={{ minWidth: 200, textAlign: 'center' }}>{formatDay(week)} – {formatDay(addDaysIso(week, 6))}</Typography>
        <IconButton onClick={() => load(childId, addDaysIso(week, 7)).catch(() => undefined)}><ChevronRightIcon /></IconButton>
      </Box>
      {loadFailed && current ? (
        <Alert severity="error" action={<Button onClick={() => load(childId).catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : !current || !data ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : (
        <Week key={`${key}/${data.days.map((d) => `${d.date}:${d.order?.id ?? ''}`).join(',')}`} childId={childId} data={data} />
      )}
    </Box>
  )
}
