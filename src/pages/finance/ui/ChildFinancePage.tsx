import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, IconButton, Tab, Tabs, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useChildFinanceStore } from '../model/childFinanceStore'
import { formatMoney } from '../../../shared/api'
import { useCan } from '../../../entities/user'
import { CategoryTiles } from './CategoryTiles'
import { ChargesTable } from './ChargesTable'
import { PaymentsTable } from './PaymentsTable'
import { HistoryTable } from './HistoryTable'
import { CreateChargeModal } from './CreateChargeModal'
import { VoidModal } from './VoidModal'
import { CreatePaymentModal } from './CreatePaymentModal'
import { AllocateModal } from './AllocateModal'
import { EnrollmentsTab } from './EnrollmentsTab'
import { AdaptationTab } from './AdaptationTab'
import { PackagesTab } from './PackagesTab'
import { HistoryButton } from '../../../widgets/auditHistory'

export const ChildFinancePage = () => {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const finance = useChildFinanceStore((s) => s.finance)
  const history = useChildFinanceStore((s) => s.history)
  const fetchFinance = useChildFinanceStore((s) => s.fetchFinance)
  const setCreateChargeModal = useChildFinanceStore((s) => s.setCreateChargeModal)
  const setCreatePaymentModal = useChildFinanceStore((s) => s.setCreatePaymentModal)
  const canEdit = useCan('finance', 'edit')
  const canTariffs = useCan('tariffs', 'view')
  const canClasses = useCan('classes', 'view')
  const [selected, setSelected] = useState('charges')

  useEffect(() => {
    if (childId) fetchFinance(childId)
  }, [childId, fetchFinance])

  if (!finance || finance.child.id !== childId) {
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  const totalDue = Number(finance.totals.totalDue)
  const tabs = [
    { key: 'charges', label: `Нарахування (${finance.charges.length})` },
    { key: 'payments', label: `Оплати (${finance.payments.length})` },
    ...(canTariffs ? [{ key: 'enrollments', label: 'Абонементи' }] : []),
    ...(canClasses ? [{ key: 'packages', label: 'Пакети' }] : []),
    ...(canTariffs ? [{ key: 'adaptation', label: 'Адаптація' }] : []),
    { key: 'history', label: 'Історія' },
  ]
  const tab = tabs.some((t) => t.key === selected) ? selected : tabs[0].key

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/finance')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {finance.child.lastName} {finance.child.firstName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Батьки:{' '}
            {finance.parents.length === 0
              ? 'не вказано'
              : finance.parents
                  .map((p) => `${p.lastName} ${p.firstName}${p.phone ? ` (${p.phone})` : ''}`)
                  .join(', ')}
          </Typography>
        </Box>
        <HistoryButton
          entityType="children"
          entityId={finance.child.id}
          title={`${finance.child.lastName} ${finance.child.firstName}`}
        />
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
        {canEdit && (
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateChargeModal({ isOpen: true })}>
            Додати нарахування
          </Button>
        )}
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreatePaymentModal({ isOpen: true })}>
            Внести оплату
          </Button>
        )}
      </Box>

      <CategoryTiles categories={finance.categories} />

      <Tabs value={tab} onChange={(_, value: string) => setSelected(value)} sx={{ mb: 2 }}>
        {tabs.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      {tab === 'charges' && <ChargesTable charges={finance.charges} />}
      {tab === 'payments' && <PaymentsTable payments={finance.payments} />}
      {tab === 'enrollments' && <EnrollmentsTab childId={finance.child.id} />}
      {tab === 'packages' && <PackagesTab childId={finance.child.id} />}
      {tab === 'adaptation' && <AdaptationTab childId={finance.child.id} />}
      {tab === 'history' && <HistoryTable events={history} />}
      <CreateChargeModal />
      <VoidModal />
      <CreatePaymentModal />
      <AllocateModal />
    </Box>
  )
}
