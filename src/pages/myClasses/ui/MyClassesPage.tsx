import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardActions, CardContent, Typography } from '@mui/material'
import { classFormatLabels, classGroupsApi, localToday, type MyClassGroup } from '../../../shared/api'

export const MyClassesPage = () => {
  const [groups, setGroups] = useState<MyClassGroup[] | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    classGroupsApi
      .getMine()
      .then(({ data }) => {
        if (active) setGroups(data)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  if (!groups) return <Typography color="text.secondary">Завантаження…</Typography>
  if (groups.length === 0) return <Typography color="text.secondary">Вам ще не призначено груп.</Typography>

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
      {groups.map((g) => (
        <Card key={g.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700 }}>{g.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {g.direction.name} · {classFormatLabels[g.format]} · дітей: {g.activeMembers}
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" variant="contained" onClick={() => navigate(`/classes/${g.id}/lessons/${localToday()}`)}>
              Відмітити сьогодні
            </Button>
            <Button size="small" onClick={() => navigate(`/classes/${g.id}`)}>
              Історія
            </Button>
          </CardActions>
        </Card>
      ))}
    </Box>
  )
}
