import { useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import { cashApi, formatMoney } from '../../../shared/api'
import type { CashEntryView } from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import { formatDateTime } from '../../../shared/lib/date'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'

interface CashTransfersBlockProps {
  items: CashEntryView[]
  onResolved: (id: string) => void
}

export const CashTransfersBlock = ({ items, onResolved }: CashTransfersBlockProps) => {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [disputing, setDisputing] = useState<CashEntryView | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const confirm = async (item: CashEntryView) => {
    setBusyId(item.id)
    try {
      await cashApi.confirmTransfer(item.id)
      onResolved(item.id)
    } finally {
      setBusyId(null)
    }
  }

  const dispute = async (note: string) => {
    if (!disputing) return
    setIsSaving(true)
    try {
      await cashApi.disputeTransfer(disputing.id, note)
      onResolved(disputing.id)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900, mb: 1.5 }}>
        Очікують отримання
      </Typography>
      <Paper elevation={0} sx={{ borderRadius: '20px', boxShadow: brandColors.outline, overflow: 'hidden' }}>
        {items.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: { xs: 'stretch', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              px: { xs: 2, sm: 3 },
              py: 2,
              '&:not(:last-of-type)': { borderBottom: `1px solid ${brandColors.hairline}` },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }}>{formatMoney(item.amount)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {`${item.createdBy.name}, ${formatDateTime(item.createdAt)}`}
              </Typography>
              {item.comment && (
                <Typography variant="body2" color="text.secondary">
                  {item.comment}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                disableElevation
                disabled={busyId === item.id}
                onClick={() => confirm(item)}
                sx={{ flex: { xs: 1, sm: 'none' } }}
              >
                Отримав
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                disabled={busyId === item.id}
                onClick={() => setDisputing(item)}
                sx={{ flex: { xs: 1, sm: 'none' } }}
              >
                Не отримав
              </Button>
            </Box>
          </Box>
        ))}
      </Paper>
      <ReasonDialog
        open={disputing !== null}
        title="Не отримав"
        subtitle={disputing ? `${formatMoney(disputing.amount)} від ${disputing.createdBy.name}` : undefined}
        isSaving={isSaving}
        onClose={() => setDisputing(null)}
        onSubmit={dispute}
      />
    </Box>
  )
}
