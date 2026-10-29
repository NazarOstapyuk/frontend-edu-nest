import { useState } from 'react'
import { Alert, Autocomplete, Box, Button, Dialog, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { mealsApi, type Child, type MealComplex, type MenuDayView } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { categoryPrices } from '../model/prices'

export const AdminOrderDialog = ({ onClose }: { onClose: () => void }) => {
  const isPhone = useIsPhone()
  const children = useMealsStore((s) => s.children)
  const complexes = useMealsStore((s) => s.complexes)
  const ordersDate = useMealsStore((s) => s.ordersDate)
  const ordersKind = useMealsStore((s) => s.ordersKind)
  const ordersGroupId = useMealsStore((s) => s.ordersGroupId)
  const isSaving = useMealsStore((s) => s.isSaving)
  const createOrders = useMealsStore((s) => s.createOrders)
  const [child, setChild] = useState<Child | null>(null)
  const [date, setDate] = useState(ordersDate)
  const [menu, setMenu] = useState<{ key: string; day: MenuDayView | null; failed: boolean } | null>(null)
  const [complexId, setComplexId] = useState('')
  const [picks, setPicks] = useState<Record<string, string>>({})
  const institutionId = child?.group?.institution.id
  const menuKey = institutionId && date ? `${institutionId}/${date}` : null

  const fetchMenu = (k: string, id: string, day: string) => {
    setMenu({ key: k, day: null, failed: false })
    mealsApi
      .getMenuDays(id, day, day)
      .then(({ data }) => setMenu((m) => (m?.key === k ? { key: k, day: data[0] ?? null, failed: false } : m)))
      .catch(() => setMenu((m) => (m?.key === k ? { key: k, day: null, failed: true } : m)))
  }

  const choose = (nextChild: Child | null, nextDate: string) => {
    setChild(nextChild)
    setDate(nextDate)
    setComplexId('')
    setPicks({})
    const id = nextChild?.group?.institution.id
    if (id && nextDate) fetchMenu(`${id}/${nextDate}`, id, nextDate)
    else setMenu(null)
  }

  const day = menu && menu.key === menuKey ? menu.day : null
  const published = day?.menu?.status === 'published' ? day.menu : null
  const categoryId = child?.group?.mealPriceCategoryId ?? null
  const priceOf = (c: MealComplex) => (categoryId ? categoryPrices(c.prices, categoryId, date).current : null)
  const available = complexes.filter(
    (c) =>
      c.active &&
      priceOf(c) &&
      c.courses.every((course) => (published?.dishes ?? []).some((d) => d.course.id === course.id)),
  )
  const effectiveComplexId = complexId || (available.length === 1 ? available[0].id : '')
  const complex = available.find((c) => c.id === effectiveComplexId)
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
    <Dialog fullScreen={isPhone} open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Нове замовлення</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Autocomplete
          options={children.filter(
            (c) => c.group && (!ordersKind || c.group.kind === ordersKind) && (!ordersGroupId || c.group.id === ordersGroupId),
          )}
          getOptionLabel={(c) => `${c.lastName} ${c.firstName}${c.group ? ` · ${c.group.institution.name}, ${c.group.name}` : ''}`}
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
            {available.length === 0 ? (
              <Alert severity="warning">
                {categoryId
                  ? 'Немає комплексу з ціною для цінової категорії групи на цю дату та зі стравами в меню на кожен курс.'
                  : 'Групі дитини не призначено цінову категорію.'}
              </Alert>
            ) : (
              <TextField select label="Комплекс" value={effectiveComplexId} onChange={(e) => { setComplexId(e.target.value); setPicks({}) }}>
                {available.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} · {priceOf(c)?.price} грн</MenuItem>)}
              </TextField>
            )}
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
            {complex && <Typography variant="body2" color="text.secondary">Ціна: {priceOf(complex)?.price} грн (за ціновою категорією групи).</Typography>}
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
