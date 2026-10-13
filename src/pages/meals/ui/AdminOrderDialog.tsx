import { useState } from 'react'
import { Alert, Autocomplete, Box, Button, Dialog, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { mealsApi, type Child, type MenuDayView } from '../../../shared/api'

export const AdminOrderDialog = ({ onClose }: { onClose: () => void }) => {
  const children = useMealsStore((s) => s.children)
  const complexes = useMealsStore((s) => s.complexes)
  const ordersDate = useMealsStore((s) => s.ordersDate)
  const isSaving = useMealsStore((s) => s.isSaving)
  const createOrders = useMealsStore((s) => s.createOrders)
  const [child, setChild] = useState<Child | null>(null)
  const [date, setDate] = useState(ordersDate)
  const [menu, setMenu] = useState<{ key: string; day: MenuDayView | null; failed: boolean } | null>(null)
  const [complexId, setComplexId] = useState('')
  const [picks, setPicks] = useState<Record<string, string>>({})
  const kind = child?.group?.kind
  const menuKey = kind && date ? `${kind}/${date}` : null

  const fetchMenu = (k: string, groupKind: NonNullable<typeof kind>, day: string) => {
    setMenu({ key: k, day: null, failed: false })
    mealsApi
      .getMenuDays(groupKind, day, day)
      .then(({ data }) => setMenu((m) => (m?.key === k ? { key: k, day: data[0] ?? null, failed: false } : m)))
      .catch(() => setMenu((m) => (m?.key === k ? { key: k, day: null, failed: true } : m)))
  }

  const choose = (nextChild: Child | null, nextDate: string) => {
    setChild(nextChild)
    setDate(nextDate)
    setComplexId('')
    setPicks({})
    const groupKind = nextChild?.group?.kind
    if (groupKind && nextDate) fetchMenu(`${groupKind}/${nextDate}`, groupKind, nextDate)
    else setMenu(null)
  }

  const day = menu && menu.key === menuKey ? menu.day : null
  const published = day?.menu?.status === 'published' ? day.menu : null
  const complex = complexes.find((c) => c.id === complexId)
  const choiceCourses = (complex?.courses ?? [])
    .map((course) => ({ course, options: (published?.dishes ?? []).filter((d) => d.course.id === course.id) }))
    .filter((c) => c.options.length > 1)
  const ready = !!child && !!published && !!complex && choiceCourses.every((c) => picks[c.course.id])

  const submit = () =>
    child && complex
      ? createOrders(child.id, [{ date, complexId: complex.id, dishIds: choiceCourses.map((c) => picks[c.course.id]) }])
          .then(onClose)
          .catch(() => undefined)
      : undefined

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Нове замовлення</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Autocomplete
          options={children.filter((c) => c.group)}
          getOptionLabel={(c) => `${c.lastName} ${c.firstName}${c.group ? ` · ${c.group.name}` : ''}`}
          value={child}
          onChange={(_, value) => choose(value, date)}
          renderInput={(params) => <TextField {...params} label="Дитина" />}
        />
        <TextField type="date" label="Дата" value={date} onChange={(e) => choose(child, e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        {child && menu?.key === menuKey && menu.failed && <Alert severity="error">Не вдалося завантажити меню.</Alert>}
        {child && menu?.key === menuKey && !menu.failed && day !== null && !published && (
          <Alert severity="warning">На цю дату меню не опубліковано.</Alert>
        )}
        {published && (
          <>
            <TextField select label="Комплекс" value={complexId} onChange={(e) => { setComplexId(e.target.value); setPicks({}) }}>
              {complexes.filter((c) => c.active).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            {choiceCourses.map(({ course, options }) => (
              <TextField
                key={course.id}
                select
                label={course.name}
                value={picks[course.id] ?? ''}
                onChange={(e) => setPicks({ ...picks, [course.id]: e.target.value })}
              >
                {options.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            ))}
            <Typography variant="body2" color="text.secondary">Ціну рахує сервер за ціновою категорією групи.</Typography>
          </>
        )}
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={submit} variant="contained" disabled={!ready || isSaving} sx={{ width: '100%' }}>Замовити</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
