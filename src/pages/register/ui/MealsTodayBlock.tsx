import { useEffect } from 'react'
import { Alert, Box, Button, Chip, Paper, Typography } from '@mui/material'
import { useMealsTodayStore } from '../model/mealsTodayStore'

export const MealsTodayBlock = ({ groupId }: { groupId: string }) => {
  const key = useMealsTodayStore((s) => s.key)
  const data = useMealsTodayStore((s) => s.data)
  const failed = useMealsTodayStore((s) => s.failed)
  const load = useMealsTodayStore((s) => s.load)

  useEffect(() => {
    load(groupId).catch(() => undefined)
  }, [groupId, load])

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mt: 3 }}>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Харчування сьогодні</Typography>
      {key === groupId && failed ? (
        <Alert severity="error" action={<Button onClick={() => load(groupId).catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : key !== groupId || !data ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : data.orders.length === 0 ? (
        <Typography color="text.secondary">Замовлень на сьогодні немає.</Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {data.summary.complexes.map((c) => <Chip key={c.complexId} label={`${c.name}: ${c.count}`} variant="outlined" />)}
          </Box>
          {data.orders.map((o) => (
            <Typography key={o.id} variant="body2">
              <b>{o.child.lastName} {o.child.firstName}</b> — {o.complex.name}: {o.items.map((i) => i.dishName).join(', ')}
            </Typography>
          ))}
        </>
      )}
    </Paper>
  )
}
