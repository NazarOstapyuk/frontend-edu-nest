import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useFamilyChildStore } from '../model/familyChildStore'
import { ChildCardTab } from './ChildCardTab'
import { ScheduleTab } from './ScheduleTab'
import { AttendanceTab } from './AttendanceTab'
import { MealsTab } from './MealsTab'
import { ChildFinanceTab } from './ChildFinanceTab'

export const FamilyChildPage = () => {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const card = useFamilyChildStore((s) => s.card)
  const finance = useFamilyChildStore((s) => s.finance)
  const storeChildId = useFamilyChildStore((s) => s.childId)
  const error = useFamilyChildStore((s) => s.error)
  const fetchChild = useFamilyChildStore((s) => s.fetchChild)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (childId) fetchChild(childId).catch(() => undefined)
  }, [childId, fetchChild])

  if (!card || !finance || storeChildId !== childId) {
    if (storeChildId === childId && error === 'notFound') {
      return <Typography color="text.secondary">Дитину не знайдено.</Typography>
    }
    if (storeChildId === childId && error === 'failed') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
          <Typography color="text.secondary">Не вдалося завантажити дані.</Typography>
          <Button variant="outlined" onClick={() => childId && fetchChild(childId).catch(() => undefined)}>Спробувати ще</Button>
        </Box>
      )
    }
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/family')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {[card.lastName, card.firstName, card.middleName].filter(Boolean).join(' ')}
        </Typography>
      </Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
        <Tab label="Картка" />
        <Tab label="Розклад" />
        <Tab label="Відвідування" />
        <Tab label="Харчування" />
        <Tab label="Фінанси" />
      </Tabs>
      {tab === 0 && <ChildCardTab card={card} />}
      {tab === 1 && <ScheduleTab childId={card.id} />}
      {tab === 2 && <AttendanceTab childId={card.id} visits={card.visits} />}
      {tab === 3 && <MealsTab childId={card.id} />}
      {tab === 4 && <ChildFinanceTab finance={finance} />}
    </Box>
  )
}
