import { useEffect, useRef, useState } from 'react'
import {
  Alert, Box, Button, ButtonBase, Checkbox, Chip, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SearchIcon from '@mui/icons-material/Search'
import { useMealsStore } from '../model/mealsStore'
import { CancelOrderDialog } from './CancelOrderDialog'
import { AdminOrderDialog } from './AdminOrderDialog'
import { courseColorAt, courseColorFor, sortCourses } from '../model/courseColors'
import { complexToneAt } from '../model/complexTones'
import { longDate, ordersLabel, weekdayNames } from '../model/menuDay'
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { brandColors } from '../../../shared/assets/brand'
import { CardField, CardList } from '../../../shared/ui/CardList'
import {
  addDaysIso, formatMoney, groupKindLabels, groupKinds, localToday, toKopecks,
  type AdminMealOrder, type GroupKind, type MealComplex, type MealCourse, type MealSummary,
} from '../../../shared/api'

const roleLabel = (role: string) => (role === 'parent' ? 'батьки' : 'адміністратор')

const kyivDay = (date: Date) => date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })

const momentLabel = (iso: string) => {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' })
  const day = kyivDay(date)
  const today = localToday()
  if (day === today) return `сьогодні, ${time}`
  if (day === addDaysIso(today, -1)) return `вчора, ${time}`
  return `${date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', timeZone: 'Europe/Kyiv' })}, ${time}`
}

const money = (kopecks: number) => formatMoney(kopecks / 100)

const personName = (p: { lastName: string; firstName: string }) => `${p.lastName} ${p.firstName}`

const childName = (o: AdminMealOrder) => personName(o.child)

const weekdayOf = (iso: string) => weekdayNames[(new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7]

const complexToneOf = (complexes: MealComplex[]) => {
  const order = [...complexes].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk')).map((c) => c.id)
  return (id: string, fallback = 0) => complexToneAt(order.includes(id) ? order.indexOf(id) : fallback)
}

const ComplexPill = ({ name, tone }: { name: string; tone: { bg: string; text: string } }) => (
  <Box component="span" sx={{ display: 'inline-block', fontSize: 13, fontWeight: 800, color: tone.text, bgcolor: tone.bg, borderRadius: 999, px: 1.25, py: 0.5, whiteSpace: 'nowrap' }}>
    {name}
  </Box>
)

const DatePager = ({ date, onChange }: { date: string; onChange: (date: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const today = localToday()
  const openPicker = () => {
    const el = inputRef.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.focus()
    }
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: { xs: '1 1 100%', sm: '0 0 auto' }, justifyContent: 'space-between' }}>
      <IconButton aria-label="Попередній день" onClick={() => onChange(addDaysIso(date, -1))} sx={{ width: 44, height: 44, bgcolor: 'background.default' }}>
        <ChevronLeftIcon />
      </IconButton>
      <Box sx={{ position: 'relative', minWidth: 210, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ButtonBase onClick={openPicker} aria-label={`Вибрати дату, зараз ${weekdayOf(date).toLowerCase()}, ${longDate(date)}`} sx={{ borderRadius: 1, px: 1, flexDirection: 'column' }}>
          <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{weekdayOf(date)}, {longDate(date)}</Typography>
          {date === today && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.dark' }}>Сьогодні</Typography>}
        </ButtonBase>
        {date !== today && (
          <Button size="small" onClick={() => onChange(today)} sx={{ minHeight: 24, py: 0, px: 1, fontSize: 12 }}>Сьогодні</Button>
        )}
        <input
          ref={inputRef}
          type="date"
          value={date}
          tabIndex={-1}
          aria-hidden
          onChange={(e) => e.target.value && onChange(e.target.value)}
          style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 0, opacity: 0, border: 0, padding: 0, pointerEvents: 'none' }}
        />
      </Box>
      <IconButton aria-label="Наступний день" onClick={() => onChange(addDaysIso(date, 1))} sx={{ width: 44, height: 44, bgcolor: 'background.default' }}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  )
}

const KitchenCard = ({ summary, orders, complexes, courses }: {
  summary: MealSummary
  orders: AdminMealOrder[]
  complexes: MealComplex[]
  courses: MealCourse[]
}) => {
  const toneOf = complexToneOf(complexes)
  const active = orders.filter((o) => !o.cancelledAt)
  const total = active.reduce((sum, o) => sum + toKopecks(o.price), 0)
  const byComplex = new Map<string, number>()
  for (const o of active) byComplex.set(o.complex.id, (byComplex.get(o.complex.id) ?? 0) + toKopecks(o.price))
  const portions = summary.complexes.reduce((sum, c) => sum + c.count, 0)
  const sorted = sortCourses(courses)
  const courseByName = new Map(sorted.map((c) => [c.name, c]))
  const groups = new Map<string, MealSummary['dishes']>()
  for (const d of summary.dishes) groups.set(d.courseName, [...(groups.get(d.courseName) ?? []), d])
  const rank = (name: string) => {
    const index = sorted.findIndex((c) => c.name === name)
    return index < 0 ? Number.MAX_SAFE_INTEGER : index
  }
  const courseNames = [...groups.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'uk'))

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>Для кухні</Typography>
        <Typography variant="body2" color="text.secondary">Скільки чого готувати. Скасовані замовлення не враховано.</Typography>
      </Box>
      {summary.complexes.length === 0 ? (
        <Typography color="text.secondary">Активних замовлень немає.</Typography>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1.5 }}>
            <Box sx={{ bgcolor: 'text.primary', color: 'background.paper', borderRadius: 2, px: 2.25, py: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>Усього порцій</Typography>
              <Typography sx={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{portions}</Typography>
              <Typography sx={{ fontSize: 13, opacity: 0.8 }}>на {money(total)}</Typography>
            </Box>
            {summary.complexes.map((c, i) => {
              const tone = toneOf(c.complexId, i)
              return (
                <Box key={c.complexId} sx={{ bgcolor: tone.bg, borderRadius: 2, px: 2.25, py: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: tone.text }}>{c.name}</Typography>
                  <Typography sx={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{c.count}</Typography>
                  {byComplex.has(c.complexId) && (
                    <Typography sx={{ fontSize: 13, color: tone.text }}>{money(byComplex.get(c.complexId) ?? 0)}</Typography>
                  )}
                </Box>
              )
            })}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5 }}>
            {courseNames.map((name, i) => {
              const course = courseByName.get(name)
              const color = course ? courseColorFor(courses, course.id) : courseColorAt(i)
              const dishes = [...(groups.get(name) ?? [])].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'uk'))
              const courseTotal = dishes.reduce((sum, d) => sum + d.count, 0)
              return (
                <Box key={name} sx={{ borderRadius: 1.5, boxShadow: `inset 0 0 0 1px ${brandColors.hairline}`, p: 1.75, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color.dot, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: color.text }}>{name}</Typography>
                    <Typography sx={{ ml: 'auto', fontSize: 13, fontWeight: 800, color: 'text.secondary' }}>{courseTotal}</Typography>
                  </Box>
                  {dishes.map((d) => (
                    <Box key={d.dishId} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>{d.name}</Typography>
                        <Typography sx={{ ml: 'auto', fontSize: 18, fontWeight: 900 }}>{d.count}</Typography>
                      </Box>
                      <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'background.default', overflow: 'hidden' }}>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: color.dot, width: `${courseTotal ? Math.round((d.count / courseTotal) * 100) : 0}%` }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )
            })}
          </Box>
        </>
      )}
    </Paper>
  )
}

interface GroupBucket {
  id: string
  name: string
  orders: AdminMealOrder[]
}

const OrderDishes = ({ order, courses }: { order: AdminMealOrder; courses: MealCourse[] }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
    {order.items.map((item) => (
      <Box
        key={`${item.courseId}-${item.dishId}`}
        component="span"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 13, fontWeight: 600, bgcolor: 'background.default', borderRadius: 1, px: 1, py: 0.5 }}
      >
        <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: courseColorFor(courses, item.courseId).dot, flexShrink: 0 }} />
        {item.dishName}
      </Box>
    ))}
  </Box>
)

const cancelNote = (o: AdminMealOrder) =>
  `Скасовано${o.cancelledAt ? ` ${momentLabel(o.cancelledAt)}` : ''}${o.cancelReason ? `: ${o.cancelReason}` : ''}${o.cancelledBy ? ` (${personName(o.cancelledBy)})` : ''}`

const strike = (o: AdminMealOrder) => (o.cancelledAt ? 'line-through' : 'none')

const GroupsSection = ({ orders, forceOpen, onCancel }: {
  orders: AdminMealOrder[]
  forceOpen: boolean
  onCancel: (order: AdminMealOrder) => void
}) => {
  const isPhone = useIsPhone()
  const canEdit = useCan('meals', 'edit')
  const groups = useMealsStore((s) => s.groups)
  const courses = useMealsStore((s) => s.courses)
  const complexes = useMealsStore((s) => s.complexes)
  const toneOf = complexToneOf(complexes)
  const [search, setSearch] = useState('')
  const [showCancelled, setShowCancelled] = useState(true)
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const query = search.trim().toLowerCase()
  const cancelledCount = orders.filter((o) => o.cancelledAt).length

  const buckets = new Map<string, GroupBucket>()
  for (const o of orders) {
    const id = o.group?.id ?? ''
    const bucket = buckets.get(id) ?? { id, name: o.group?.name ?? 'Без групи', orders: [] }
    bucket.orders.push(o)
    buckets.set(id, bucket)
  }
  const visible = [...buckets.values()]
    .sort((a, b) => (a.id === '' ? 1 : b.id === '' ? -1 : a.name.localeCompare(b.name, 'uk')))
    .map((b) => ({
      ...b,
      shown: b.orders
        .filter((o) => showCancelled || !o.cancelledAt)
        .filter((o) => !query || childName(o).toLowerCase().includes(query))
        .sort((x, y) => childName(x).localeCompare(childName(y), 'uk')),
    }))
    .filter((b) => b.shown.length > 0)
  const openAll = forceOpen || query !== ''

  const cancelButton = (o: AdminMealOrder) =>
    canEdit && !o.cancelledAt ? (
      <Button color="error" size="small" onClick={() => onCancel(o)}>Скасувати</Button>
    ) : null

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>Замовлення по групах</Typography>
        <Box sx={{ flex: 1 }} />
        <TextField
          size="small"
          type="search"
          placeholder="Пошук дитини"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Пошук дитини' },
            input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
          }}
          sx={{ minWidth: { sm: 260 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
        />
        <FormControlLabel
          control={<Checkbox checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />}
          label={`Показувати скасовані (${cancelledCount})`}
          sx={{ mr: 0, color: 'text.secondary' }}
        />
      </Box>

      {visible.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">{orders.length === 0 ? 'Замовлень немає.' : 'Нічого не знайдено.'}</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visible.map((bucket, index) => {
            const open = toggled[bucket.id] ?? (openAll || index === 0)
            const active = bucket.orders.filter((o) => !o.cancelledAt)
            const kind = groups.find((g) => g.id === bucket.id)?.kind
            const counts = new Map<string, { name: string; count: number }>()
            for (const o of active) counts.set(o.complex.id, { name: o.complex.name, count: (counts.get(o.complex.id)?.count ?? 0) + 1 })
            const sum = active.reduce((s, o) => s + toKopecks(o.price), 0)
            return (
              <Paper key={bucket.id || 'none'} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <ButtonBase
                  aria-expanded={open}
                  onClick={() => setToggled((t) => ({ ...t, [bucket.id]: !open }))}
                  sx={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap',
                    gap: 1.5, px: { xs: 2, sm: 2.5 }, py: 2, textAlign: 'left',
                  }}
                >
                  <ExpandMoreIcon sx={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms' }} />
                  <Typography sx={{ fontSize: 17, fontWeight: 900 }}>{bucket.name}</Typography>
                  {kind && <Chip size="small" label={groupKindLabels[kind]} sx={{ bgcolor: 'background.default', borderRadius: 1.5 }} />}
                  <Typography variant="body2" color="text.secondary">{ordersLabel(active.length)}</Typography>
                  <Box sx={{ flex: 1 }} />
                  {[...counts.entries()].map(([id, c], i) => (
                    <ComplexPill key={id} name={`${c.name} ${c.count}`} tone={toneOf(id, i)} />
                  ))}
                  <Typography sx={{ fontSize: 15, fontWeight: 900, minWidth: 80, textAlign: 'right' }}>{money(sum)}</Typography>
                </ButtonBase>
                {open && isPhone && (
                  <Box sx={{ px: 1.5, pb: 1.5 }}>
                    <CardList
                      items={bucket.shown}
                      getKey={(o) => o.id}
                      renderCard={(o) => (
                        <Box sx={{ opacity: o.cancelledAt ? 0.6 : 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontWeight: 800, textDecoration: strike(o), flex: 1 }}>{childName(o)}</Typography>
                            <ComplexPill name={o.complex.name} tone={toneOf(o.complex.id)} />
                          </Box>
                          <OrderDishes order={o} courses={courses} />
                          <Box sx={{ mt: 1 }}>
                            <CardField label="Ціна">
                              <Box component="span" sx={{ fontWeight: 800, textDecoration: strike(o) }}>{formatMoney(o.price)}</Box>
                            </CardField>
                            <CardField label="Замовив">{personName(o.createdBy)} ({roleLabel(o.createdBy.role)}), {momentLabel(o.createdAt)}</CardField>
                          </Box>
                          {o.cancelledAt && (
                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: brandColors.debt }}>{cancelNote(o)}</Typography>
                          )}
                          {canEdit && !o.cancelledAt && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>{cancelButton(o)}</Box>
                          )}
                        </Box>
                      )}
                    />
                  </Box>
                )}
                {open && !isPhone && (
                  <Box sx={{ overflowX: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Table size="small" sx={{ minWidth: 820 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ pl: 2.5 }}>Дитина</TableCell>
                          <TableCell>Комплекс</TableCell>
                          <TableCell>Що обрали</TableCell>
                          <TableCell>Замовив</TableCell>
                          <TableCell align="right">Ціна</TableCell>
                          <TableCell sx={{ pr: 2.5 }} aria-label="Дії" />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bucket.shown.map((o) => (
                          <TableRow key={o.id} sx={{ opacity: o.cancelledAt ? 0.6 : 1, '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell sx={{ pl: 2.5, fontWeight: 800, whiteSpace: 'nowrap', textDecoration: strike(o) }}>{childName(o)}</TableCell>
                            <TableCell><ComplexPill name={o.complex.name} tone={toneOf(o.complex.id)} /></TableCell>
                            <TableCell>
                              <OrderDishes order={o} courses={courses} />
                              {o.cancelledAt && (
                                <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 700, color: brandColors.debt }}>{cancelNote(o)}</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{personName(o.createdBy)}</Typography>
                              <Typography variant="caption" color="text.secondary">{roleLabel(o.createdBy.role)} · {momentLabel(o.createdAt)}</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap', textDecoration: strike(o) }}>{formatMoney(o.price)}</TableCell>
                            <TableCell align="right" sx={{ pr: 2.5 }}>{cancelButton(o)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Paper>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

export const OrdersTab = () => {
  const canEdit = useCan('meals', 'edit')
  const date = useMealsStore((s) => s.ordersDate)
  const kind = useMealsStore((s) => s.ordersKind)
  const groupId = useMealsStore((s) => s.ordersGroupId)
  const key = useMealsStore((s) => s.ordersKey)
  const orders = useMealsStore((s) => s.orders)
  const summary = useMealsStore((s) => s.summary)
  const failed = useMealsStore((s) => s.ordersFailed)
  const groups = useMealsStore((s) => s.groups)
  const complexes = useMealsStore((s) => s.complexes)
  const courses = useMealsStore((s) => s.courses)
  const deadline = useMealsStore((s) => s.deadline)
  const loadOrders = useMealsStore((s) => s.loadOrders)
  const [cancelling, setCancelling] = useState<AdminMealOrder | null>(null)
  const [creating, setCreating] = useState(false)
  const currentKey = `${date}/${kind}/${groupId}`
  const ready = key === currentKey && summary !== null

  useEffect(() => {
    loadOrders().catch(() => undefined)
  }, [loadOrders])

  const go = (patch: Parameters<typeof loadOrders>[0]) => loadOrders(patch).catch(() => undefined)

  return (
    <Box>
      <Paper variant="outlined" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', p: 1.5, mb: 2.5, borderRadius: 2 }}>
        <DatePager date={date} onChange={(next) => go({ date: next })} />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={kind}
          aria-label="Тип закладу"
          onChange={(_, v: GroupKind | '' | null) => v !== null && go({ kind: v, groupId: '' })}
          sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, '& .MuiToggleButton-root': { flex: { xs: 1, sm: 'none' }, minHeight: 40, px: 1.75 } }}
        >
          <ToggleButton value="">Усі</ToggleButton>
          {groupKinds.map((k) => <ToggleButton key={k} value={k}>{groupKindLabels[k]}</ToggleButton>)}
        </ToggleButtonGroup>
        <TextField
          select
          size="small"
          label="Група"
          value={groupId}
          onChange={(e) => go({ groupId: e.target.value })}
          sx={{ minWidth: 180, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
        >
          <MenuItem value="">Усі групи</MenuItem>
          {groups.filter((g) => !kind || g.kind === kind).map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
        </TextField>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderRadius: 1, bgcolor: brandColors.oliveTint, color: brandColors.inkOnOliveSoft }}>
          <ScheduleIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Батьки замовляють до {deadline}</Typography>
        </Box>
        <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Нове замовлення
          </Button>
        )}
      </Paper>

      {failed && key === currentKey ? (
        <Alert severity="error" action={<Button onClick={() => go({})}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : !ready ? (
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
      ) : (
        <>
          <KitchenCard summary={summary} orders={orders} complexes={complexes} courses={courses} />
          <GroupsSection key={currentKey} orders={orders} forceOpen={groupId !== ''} onCancel={setCancelling} />
        </>
      )}
      {cancelling && <CancelOrderDialog order={cancelling} onClose={() => setCancelling(null)} />}
      {creating && <AdminOrderDialog onClose={() => setCreating(false)} />}
    </Box>
  )
}
