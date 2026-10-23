import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useFamilyChildStore } from '../model/familyChildStore'
import { ChildCardTab } from './ChildCardTab'
import { ScheduleTab } from './ScheduleTab'
import { RoutineTab } from './RoutineTab'
import { AttendanceTab } from './AttendanceTab'
import { MealsTab } from './MealsTab'
import { ChildFinanceTab } from './ChildFinanceTab'
import { PaymentReturnBanner } from './PaymentReturnBanner'

export const FamilyChildPage = () => {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const card = useFamilyChildStore((s) => s.card)
  const finance = useFamilyChildStore((s) => s.finance)
  const storeChildId = useFamilyChildStore((s) => s.childId)
  const error = useFamilyChildStore((s) => s.error)
  const fetchChild = useFamilyChildStore((s) => s.fetchChild)
  const reloadFinance = useFamilyChildStore((s) => s.reloadFinance)
  const [searchParams] = useSearchParams()
  const [returnInvoice] = useState(() => searchParams.get('invoice'))
  const [tab, setTab] = useState(returnInvoice ? 'finance' : 'card')

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

  const kindergarten = card.group?.kind === 'kindergarten'

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
      {returnInvoice && (
        <PaymentReturnBanner invoiceId={returnInvoice} onSuccess={() => reloadFinance(card.id).catch(() => undefined)} />
      )}
      <Tabs value={tab} onChange={(_, v: string) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
        <Tab value="card" label="Картка" />
        {kindergarten ? <Tab value="routine" label="Розпорядок" /> : <Tab value="schedule" label="Розклад" />}
        <Tab value="attendance" label="Відвідування" />
        <Tab value="meals" label="Харчування" />
        <Tab value="finance" label="Фінанси" />
      </Tabs>
      {tab === 'card' && <ChildCardTab card={card} />}
      {tab === 'routine' && kindergarten && <RoutineTab childId={card.id} />}
      {tab === 'schedule' && !kindergarten && <ScheduleTab childId={card.id} />}
      {tab === 'attendance' && <AttendanceTab childId={card.id} visits={card.visits} />}
      {tab === 'meals' && <MealsTab childId={card.id} />}
      {tab === 'finance' && <ChildFinanceTab childId={card.id} finance={finance} />}
    </Box>
  )
}
