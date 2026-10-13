import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Checkbox, Chip, FormControlLabel, IconButton, MenuItem, Paper, TextField, Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useChildMealsStore } from '../model/childMealsStore'
import { addDaysIso, formatDay, isoWeekdayLabels, type ParentMenu, type ParentMenuDay } from '../../../shared/api'

type Selection = { include: boolean; complexId: string; picks: Record<string, string> }

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' })

const weekdayOf = (date: string) => isoWeekdayLabels[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]

const choiceCourses = (day: ParentMenuDay, complexId: string) =>
  (day.complexes.find((c) => c.id === complexId)?.courses ?? []).filter((c) => c.options.length > 1)

const isComplete = (day: ParentMenuDay, s: Selection | undefined) =>
  !!s && !!s.complexId && choiceCourses(day, s.complexId).every((c) => s.picks[c.id])

const Week = ({ childId, data }: { childId: string; data: ParentMenu }) => {
  const isSaving = useChildMealsStore((s) => s.isSaving)
  const order = useChildMealsStore((s) => s.order)
  const cancel = useChildMealsStore((s) => s.cancel)
  const [selection, setSelection] = useState<Record<string, Selection>>({})
  const update = (date: string, patch: Partial<Selection>) =>
    setSelection((prev) => ({ ...prev, [date]: { ...(prev[date] ?? { include: false, complexId: '', picks: {} }), ...patch } }))

  const chosen = data.days.filter((d) => d.canOrder && selection[d.date]?.include && isComplete(d, selection[d.date]))
  const total = chosen.reduce((sum, d) => sum + Number(d.complexes.find((c) => c.id === selection[d.date].complexId)?.price ?? 0), 0)

  const submit = () =>
    order(
      childId,
      chosen.map((d) => {
        const s = selection[d.date]
        return { date: d.date, complexId: s.complexId, dishIds: choiceCourses(d, s.complexId).map((c) => s.picks[c.id]) }
      }),
    )
      .then(() => setSelection({}))
      .catch(() => undefined)

  if (data.days.length === 0) return <Typography color="text.secondary">Меню на цей тиждень ще не опубліковано.</Typography>

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">Замовити або скасувати можна до {data.deadline} у день харчування.</Typography>
      {data.days.map((day) => {
        const s = selection[day.date]
        return (
          <Paper key={day.date} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 700 }}>{weekdayOf(day.date)} {formatDay(day.date)}</Typography>
              {day.open ? (
                <Chip size="small" label={`до ${timeOf(day.deadlineAt)}`} />
              ) : (
                <Chip size="small" label="Замовлення закрито" />
              )}
            </Box>
            {day.dishes.map((d) => (
              <Typography key={d.id} variant="body2">{d.course.name}: {d.name}</Typography>
            ))}
            {day.order && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip color="success" label={`Замовлено: ${day.order.complex.name}, ${day.order.price} грн`} />
                <Typography variant="body2">{day.order.items.map((i) => i.dishName).join(', ')}</Typography>
                {day.canCancel && (
                  <Button size="small" color="error" disabled={isSaving} onClick={() => cancel(childId, day.order!.id).catch(() => undefined)}>
                    Скасувати
                  </Button>
                )}
              </Box>
            )}
            {day.canOrder && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControlLabel
                  control={<Checkbox checked={!!s?.include} onChange={(e) => update(day.date, { include: e.target.checked })} />}
                  label="Замовити"
                />
                <TextField select size="small" label="Комплекс" value={s?.complexId ?? ''} onChange={(e) => update(day.date, { complexId: e.target.value, picks: {}, include: true })} sx={{ minWidth: 220 }}>
                  {day.complexes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} — {c.price} грн</MenuItem>)}
                </TextField>
                {s?.complexId && choiceCourses(day, s.complexId).map((course) => (
                  <TextField
                    key={course.id}
                    select
                    size="small"
                    label={course.name}
                    value={s.picks[course.id] ?? ''}
                    onChange={(e) => update(day.date, { picks: { ...s.picks, [course.id]: e.target.value } })}
                    sx={{ minWidth: 180 }}
                  >
                    {course.options.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                  </TextField>
                ))}
              </Box>
            )}
          </Paper>
        )
      })}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        {chosen.length > 0 && <Typography>Днів: {chosen.length}, разом {total.toFixed(2)} грн</Typography>}
        <Button variant="contained" disabled={chosen.length === 0 || isSaving} onClick={submit}>Замовити</Button>
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
