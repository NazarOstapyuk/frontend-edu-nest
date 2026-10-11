import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useChildFinanceStore } from '../model/childFinanceStore'
import { formatMoney } from '../../../shared/api'
import { CategoryTiles } from './CategoryTiles'
import { ChargesTable } from './ChargesTable'
import { PaymentsTable } from './PaymentsTable'
import { HistoryTable } from './HistoryTable'
import { CreateChargeModal } from './CreateChargeModal'
import { VoidModal } from './VoidModal'
import { CreatePaymentModal } from './CreatePaymentModal'
import { AllocateModal } from './AllocateModal'
import { EnrollmentsTab } from './EnrollmentsTab'

export const ChildFinancePage = () => {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const finance = useChildFinanceStore((s) => s.finance)
  const history = useChildFinanceStore((s) => s.history)
  const fetchFinance = useChildFinanceStore((s) => s.fetchFinance)
  const setCreateChargeModal = useChildFinanceStore((s) => s.setCreateChargeModal)
  const setCreatePaymentModal = useChildFinanceStore((s) => s.setCreatePaymentModal)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (childId) fetchFinance(childId)
  }, [childId, fetchFinance])

  if (!finance || finance.child.id !== childId) {
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  const totalDue = Number(finance.totals.totalDue)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/finance')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {finance.child.lastName} {finance.child.firstName}
        </Typography>
        <Box sx={{ ml: 'auto', textAlign: 'right' }}>
          <Typography sx={{ fontWeight: 700, color: totalDue > 0 ? 'error.main' : 'success.main' }}>
            {totalDue >= 0
              ? `Разом до сплати: ${formatMoney(totalDue)}`
              : `Передоплата: ${formatMoney(-totalDue)}`}
          </Typography>
          {Number(finance.totals.unallocated) > 0 && (
            <Typography variant="body2" color="text.secondary">
              Нерозподілено: {formatMoney(finance.totals.unallocated)}
            </Typography>
          )}
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateChargeModal({ isOpen: true })}>
          Додати нарахування
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreatePaymentModal({ isOpen: true })}>
          Внести оплату
        </Button>
      </Box>

      <CategoryTiles categories={finance.categories} />

      <Tabs value={tab} onChange={(_, value: number) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label={`Нарахування (${finance.charges.length})`} />
        <Tab label={`Оплати (${finance.payments.length})`} />
        <Tab label="Абонементи" />
        <Tab label="Адаптація" />
        <Tab label="Історія" />
      </Tabs>

      {tab === 0 && <ChargesTable charges={finance.charges} />}
      {tab === 1 && <PaymentsTable payments={finance.payments} />}
      {tab === 2 && <EnrollmentsTab childId={finance.child.id} />}
      {tab === 4 && <HistoryTable events={history} />}
      <CreateChargeModal />
      <VoidModal />
      <CreatePaymentModal />
      <AllocateModal />
    </Box>
  )
}
