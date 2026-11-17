import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Paper, Skeleton, Tab, Tabs, Typography } from '@mui/material'
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined'
import { useCan } from '../../../entities/user'
import { brandColors } from '../../../shared/assets/brand'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { useCashStore } from '../model/cashStore'
import { DeskCard } from './DeskCard'
import { EntriesList } from './EntriesList'
import { CountDialog } from './CountDialog'
import { WithdrawDialog } from './WithdrawDialog'
import { CorrectionDialog } from './CorrectionDialog'
import { AcceptPaymentDialog } from './AcceptPaymentDialog'

type CashTab = 'now' | 'shifts' | 'settings'

const NowTab = () => {
  const canEdit = useCan('cash', 'edit')
  const canControl = useCan('cash_control', 'edit')
  const desks = useCashStore((s) => s.desks)
  const shiftReports = useCashStore((s) => s.shiftReports)
  const isLoading = useCashStore((s) => s.isLoading)
  const isDeleting = useCashStore((s) => s.isDeleting)
  const voidDialog = useCashStore((s) => s.voidDialog)
  const fetchDesks = useCashStore((s) => s.fetchDesks)
  const voidEntry = useCashStore((s) => s.voidEntry)
  const setCountDialog = useCashStore((s) => s.setCountDialog)
  const setWithdrawDialog = useCashStore((s) => s.setWithdrawDialog)
  const setCorrectionDialog = useCashStore((s) => s.setCorrectionDialog)
  const setAcceptDialog = useCashStore((s) => s.setAcceptDialog)
  const setVoidDialog = useCashStore((s) => s.setVoidDialog)

  useEffect(() => {
    fetchDesks().catch(() => undefined)
  }, [fetchDesks])

  if (isLoading && desks.length === 0) {
    return <Skeleton variant="rounded" height={420} sx={{ borderRadius: '20px' }} />
  }

  if (desks.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{ borderRadius: '20px', boxShadow: brandColors.outline, p: { xs: 3, sm: 5 }, textAlign: 'center' }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 2,
            borderRadius: '16px',
            bgcolor: brandColors.oliveTint,
            color: brandColors.inkOnOliveSoft,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <PointOfSaleOutlinedIcon />
        </Box>
        <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Активних кас немає</Typography>
        <Typography variant="body2" color="text.secondary">
          {canControl ? 'Додайте касу на вкладці «Налаштування».' : 'Зверніться до керівника, щоб додати касу.'}
        </Typography>
      </Paper>
    )
  }

  const voidEntryData = voidDialog.entry

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {desks.map((desk) => {
        const report = desk.openShift ? shiftReports[desk.openShift.id] : undefined
        return (
          <Box key={desk.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <DeskCard
              desk={desk}
              canEdit={canEdit}
              canControl={canControl}
              onOpenShift={() => setCountDialog({ isOpen: true, mode: 'open', desk })}
              onCloseShift={() => setCountDialog({ isOpen: true, mode: 'close', desk })}
              onAcceptPayment={() => setAcceptDialog({ isOpen: true, desk })}
              onExpense={() => setWithdrawDialog({ isOpen: true, kind: 'expense', desk })}
              onTransfer={() => setWithdrawDialog({ isOpen: true, kind: 'transfer', desk })}
              onCorrection={() => setCorrectionDialog({ isOpen: true, desk })}
            />
            {report && (
              <EntriesList
                entries={report.entries}
                canEdit={canEdit}
                onVoid={(entry) => setVoidDialog({ isOpen: true, entry })}
              />
            )}
          </Box>
        )
      })}

      <CountDialog />
      <WithdrawDialog />
      <CorrectionDialog />
      <AcceptPaymentDialog />
      <ReasonDialog
        open={voidDialog.isOpen}
        title="Скасувати операцію"
        subtitle="Скасована операція залишиться в списку закресленою, а сума повернеться до залишку каси."
        confirmLabel="Скасувати операцію"
        isSaving={isDeleting}
        onClose={() => setVoidDialog({ isOpen: false, entry: null })}
        onSubmit={async (reason) => {
          if (voidEntryData) await voidEntry(voidEntryData.id, reason)
        }}
      />
    </Box>
  )
}

export const CashPage = () => {
  const canControlEdit = useCan('cash_control', 'edit')
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const tab: CashTab =
    requested === 'shifts' ? 'shifts' : requested === 'settings' && canControlEdit ? 'settings' : 'now'

  const changeTab = (value: CashTab) => {
    const next = new URLSearchParams(searchParams)
    if (value === 'now') next.delete('tab')
    else next.set('tab', value)
    setSearchParams(next, { replace: true })
  }

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, value: CashTab) => changeTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 3 }}
      >
        <Tab value="now" label="Зараз" />
        <Tab value="shifts" label="Зміни" />
        {canControlEdit && <Tab value="settings" label="Налаштування" />}
      </Tabs>
      {tab === 'now' && <NowTab />}
      {tab === 'shifts' && <Box />}
      {tab === 'settings' && <Box />}
    </Box>
  )
}
