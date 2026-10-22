import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardActions, CardContent, Paper, Typography } from '@mui/material'
import { useFamilyStore } from '../model/familyStore'
import { formatMoney } from '../../../shared/api'

const fullName = (c: { lastName: string; firstName: string; middleName: string | null }) =>
  [c.lastName, c.firstName, c.middleName].filter(Boolean).join(' ')

export const FamilyPage = () => {
  const family = useFamilyStore((s) => s.family)
  const hasError = useFamilyStore((s) => s.hasError)
  const fetchFamily = useFamilyStore((s) => s.fetchFamily)
  const navigate = useNavigate()

  useEffect(() => {
    fetchFamily().catch(() => undefined)
  }, [fetchFamily])

  if (!family) {
    if (hasError) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
          <Typography color="text.secondary">Не вдалося завантажити дані.</Typography>
          <Button variant="outlined" onClick={() => fetchFamily().catch(() => undefined)}>Спробувати ще</Button>
        </Box>
      )
    }
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  const due = Number(family.totals.due)
  const overdue = Number(family.totals.overdue)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">До оплати</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: due > 0 ? 'error.main' : 'success.main' }}>
            {formatMoney(family.totals.due)}
          </Typography>
          {overdue > 0 && (
            <Typography variant="body2" color="error.main">з них прострочено {formatMoney(family.totals.overdue)}</Typography>
          )}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">Передоплата</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatMoney(family.totals.prepayment)}</Typography>
        </Box>
      </Paper>

      {family.children.length === 0 && (
        <Typography color="text.secondary">До вашого акаунта ще не прив'язано дітей. Зверніться до адміністратора.</Typography>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(300px, 1fr))' } }}>
        {family.children.map((child) => (
          <Card key={child.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700 }}>{fullName(child)}</Typography>
              <Typography variant="body2" color="text.secondary">{child.group?.name ?? 'Без групи'}</Typography>
              {child.institution && (
                <Typography variant="body2" color="text.secondary">{child.institution.name}</Typography>
              )}
              <Typography sx={{ mt: 1, fontWeight: 600, color: Number(child.due) > 0 ? 'error.main' : 'success.main' }}>
                До оплати: {formatMoney(child.due)}
              </Typography>
              {Number(child.overdue) > 0 && (
                <Typography variant="body2" color="error.main">Прострочено: {formatMoney(child.overdue)}</Typography>
              )}
              {Number(child.prepayment) > 0 && (
                <Typography variant="body2" color="text.secondary">Передоплата: {formatMoney(child.prepayment)}</Typography>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" onClick={() => navigate(`/family/${child.id}`)}>
                Детальніше
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
