import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useFamilyChildStore } from '../model/familyChildStore'
import { parentCabinetApi } from '../../../shared/api'
import { ChildCardTab } from './ChildCardTab'
import { ScheduleTab } from './ScheduleTab'
import { RoutineTab } from './RoutineTab'
import { AttendanceTab } from './AttendanceTab'
import { MealsTab } from './MealsTab'
import { ChildFinanceTab } from './ChildFinanceTab'
import { PaymentReturnBanner } from './PaymentReturnBanner'
import { brandColors, mascotUrl } from '../../../shared/assets/brand'

const tabValues = ['card', 'routine', 'schedule', 'attendance', 'meals', 'finance']

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
  const [requestedTab] = useState(() => {
    const value = searchParams.get('tab')
    return value && tabValues.includes(value) ? value : null
  })
  const [familySize, setFamilySize] = useState<number | null>(null)
  const [pickedTab, setTab] = useState<string | null>(null)

  useEffect(() => {
    parentCabinetApi
      .getFamily()
      .then(({ data }) => setFamilySize(data.children.length))
      .catch(() => undefined)
  }, [])

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
  const tab =
    pickedTab ??
    (returnInvoice ? 'finance' : (requestedTab ?? (finance.summary.some((s) => Number(s.due) > 0) ? 'finance' : 'card')))

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: brandColors.olive,
          color: brandColors.inkOnOlive,
          borderRadius: '24px',
          pl: { xs: 2, sm: 3 },
          pr: { xs: '110px', sm: '170px' },
          py: { xs: 2.5, sm: 3 },
          mb: 2,
          minHeight: { xs: 124, sm: 164 },
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {familySize !== 1 && (
            <IconButton onClick={() => navigate('/family')} aria-label="Назад" sx={{ color: 'inherit', ml: -1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography component="h1" sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 900, lineHeight: 1.2, minWidth: 0, overflowWrap: 'anywhere' }}>
            {[card.lastName, card.firstName, card.middleName].filter(Boolean).join(' ')}
          </Typography>
        </Box>
        {(card.group || card.institution) && (
          <Typography sx={{ mt: 0.5, fontWeight: 700, color: brandColors.inkOnOliveSoft }}>
            {[
              card.group ? `${card.group.kind === 'kindergarten' ? 'Група' : 'Клас'} ${card.group.name}` : null,
              card.institution?.name,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        )}
        <Box
          component="img"
          src={mascotUrl}
          alt=""
          sx={{ position: 'absolute', right: { xs: 8, sm: 24 }, bottom: 0, width: { xs: 96, sm: 130 } }}
        />
      </Box>
      {returnInvoice && (
        <PaymentReturnBanner invoiceId={returnInvoice} onSuccess={() => reloadFinance(card.id).catch(() => undefined)} />
      )}
      <Tabs value={tab} onChange={(_, v: string) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
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
