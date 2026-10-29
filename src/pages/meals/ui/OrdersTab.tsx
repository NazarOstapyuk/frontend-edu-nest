import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useMealsStore } from '../model/mealsStore'
import { CancelOrderDialog } from './CancelOrderDialog'
import { AdminOrderDialog } from './AdminOrderDialog'
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'
import { groupKindLabels, groupKinds, type AdminMealOrder, type GroupKind } from '../../../shared/api'

const roleLabel = (role: string) => (role === 'parent' ? 'батьки' : 'адміністратор')

export const OrdersTab = () => {
  const isPhone = useIsPhone()
  const canEdit = useCan('meals', 'edit')
  const date = useMealsStore((s) => s.ordersDate)
  const kind = useMealsStore((s) => s.ordersKind)
  const groupId = useMealsStore((s) => s.ordersGroupId)
  const key = useMealsStore((s) => s.ordersKey)
  const orders = useMealsStore((s) => s.orders)
  const summary = useMealsStore((s) => s.summary)
  const failed = useMealsStore((s) => s.ordersFailed)
  const groups = useMealsStore((s) => s.groups)
  const loadOrders = useMealsStore((s) => s.loadOrders)
  const [cancelling, setCancelling] = useState<AdminMealOrder | null>(null)
  const [creating, setCreating] = useState(false)
  const ready = key === `${date}/${kind}/${groupId}` && summary !== null

  useEffect(() => {
    loadOrders().catch(() => undefined)
  }, [loadOrders])

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <TextField size="small" type="date" label="Дата" value={date} onChange={(e) => e.target.value && loadOrders({ date: e.target.value }).catch(() => undefined)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField select size="small" label="Тип" value={kind} onChange={(e) => loadOrders({ kind: e.target.value as GroupKind | '', groupId: '' }).catch(() => undefined)} sx={{ minWidth: 140 }}>
          <MenuItem value="">Усі</MenuItem>
          {groupKinds.map((k) => <MenuItem key={k} value={k}>{groupKindLabels[k]}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Група" value={groupId} onChange={(e) => loadOrders({ groupId: e.target.value }).catch(() => undefined)} sx={{ minWidth: 180 }}>
          <MenuItem value="">Усі</MenuItem>
          {groups.filter((g) => !kind || g.kind === kind).map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Замовлення
          </Button>
        )}
      </Box>

      {failed && key === `${date}/${kind}/${groupId}` ? (
        <Alert severity="error" action={<Button onClick={() => loadOrders().catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : !ready ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : (
        <>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Порції</Typography>
            {summary.complexes.length === 0 ? (
              <Typography color="text.secondary">Активних замовлень немає.</Typography>
            ) : (
              <>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {summary.complexes.map((c) => <Chip key={c.complexId} label={`${c.name}: ${c.count}`} color="primary" variant="outlined" />)}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {summary.dishes.map((d) => <Chip key={d.dishId} size="small" label={`${d.courseName}: ${d.name} × ${d.count}`} />)}
                </Box>
              </>
            )}
          </Paper>
          {isPhone ? (
            <CardList
              items={orders}
              getKey={(o) => o.id}
              empty={<Typography color="text.secondary">Замовлень немає.</Typography>}
              renderCard={(o) => (
                <Box sx={{ opacity: o.cancelledAt ? 0.7 : 1 }}>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{o.child.lastName} {o.child.firstName}</Typography>
                  <CardField label="Група">{o.group?.name ?? '—'}</CardField>
                  <CardField label="Комплекс">{o.complex.name}</CardField>
                  <CardField label="Страви">{o.items.map((i) => i.dishName).join(', ')}</CardField>
                  <CardField label="Ціна">{o.price} грн</CardField>
                  <CardField label="Замовив">{o.createdBy.lastName} {o.createdBy.firstName} ({roleLabel(o.createdBy.role)})</CardField>
                  <Box sx={{ mt: 0.75 }}>
                    {o.cancelledAt ? (
                      <Typography variant="body2" color="text.secondary">
                        Скасовано{o.cancelReason ? `: ${o.cancelReason}` : ''}{o.cancelledBy ? ` (${o.cancelledBy.lastName} ${o.cancelledBy.firstName})` : ''}
                      </Typography>
                    ) : (
                      <Chip size="small" color="success" label="Активне" />
                    )}
                  </Box>
                  {canEdit && !o.cancelledAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                      <Button color="error" sx={{ minHeight: 40 }} onClick={() => setCancelling(o)}>Скасувати</Button>
                    </Box>
                  )}
                </Box>
              )}
            />
          ) : (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell>Дитина</TableCell>
                  <TableCell>Група</TableCell>
                  <TableCell>Комплекс</TableCell>
                  <TableCell>Страви</TableCell>
                  <TableCell>Ціна</TableCell>
                  <TableCell>Замовив</TableCell>
                  <TableCell>Стан</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow><TableCell colSpan={8} sx={{ color: 'text.secondary' }}>Замовлень немає.</TableCell></TableRow>
                ) : orders.map((o) => (
                  <TableRow key={o.id} sx={{ opacity: o.cancelledAt ? 0.55 : 1 }}>
                    <TableCell>{o.child.lastName} {o.child.firstName}</TableCell>
                    <TableCell>{o.group?.name ?? '—'}</TableCell>
                    <TableCell>{o.complex.name}</TableCell>
                    <TableCell>{o.items.map((i) => i.dishName).join(', ')}</TableCell>
                    <TableCell>{o.price} грн</TableCell>
                    <TableCell>{o.createdBy.lastName} {o.createdBy.firstName} ({roleLabel(o.createdBy.role)})</TableCell>
                    <TableCell>
                      {o.cancelledAt ? (
                        <Typography variant="body2" color="text.secondary">
                          Скасовано{o.cancelReason ? `: ${o.cancelReason}` : ''}{o.cancelledBy ? ` (${o.cancelledBy.lastName} ${o.cancelledBy.firstName})` : ''}
                        </Typography>
                      ) : (
                        <Chip size="small" color="success" label="Активне" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && !o.cancelledAt && <Button size="small" color="error" onClick={() => setCancelling(o)}>Скасувати</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          )}
        </>
      )}
      {cancelling && <CancelOrderDialog order={cancelling} onClose={() => setCancelling(null)} />}
      {creating && <AdminOrderDialog onClose={() => setCreating(false)} />}
    </Box>
  )
}
