import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, ButtonBase, Typography } from '@mui/material'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import { cashAlertTypeLabels, cashApi, formatMoney } from '../../../shared/api'
import type { CashAlertView } from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import { formatDateTime } from '../../../shared/lib/date'
import { cashAlertLink } from './cashAlertLink'
import { usePendingCashStore } from '../../../shared/model/pendingCashStore'

interface CashAlertsBlockProps {
  alerts: CashAlertView[]
  onAcked: (ids: string[]) => void
}

const signedAmount = (amount: string) => {
  const negative = amount.startsWith('-')
  return { text: negative ? formatMoney(amount) : `+${formatMoney(amount)}`, negative }
}

export const CashAlertsBlock = ({ alerts, onAcked }: CashAlertsBlockProps) => {
  const refreshBadge = usePendingCashStore((s) => s.refresh)
  const [busy, setBusy] = useState(false)

  const ack = async (ids: string[], request: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await request()
      onAcked(ids)
      refreshBadge().catch(() => undefined)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {alerts.map((alert) => {
        const amount = alert.amount ? signedAmount(alert.amount) : null
        const meta = [alert.actor?.name, formatDateTime(alert.createdAt)].filter(Boolean).join(', ')
        return (
          <Box
            key={alert.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderTop: `1px solid ${brandColors.hairline}`,
              pr: { xs: 1, sm: 2 },
            }}
          >
            <ButtonBase
              component={RouterLink}
              to={cashAlertLink(alert)}
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 2,
                px: { xs: 2, sm: 3 },
                py: 2,
                textAlign: 'left',
                '&:hover': { bgcolor: brandColors.hoverRow },
                '&.Mui-focusVisible': { outline: `2px solid ${brandColors.orange}`, outlineOffset: -2 },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  bgcolor: brandColors.orangeTint,
                  color: brandColors.orangeText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PointOfSaleIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }}>
                  {`${cashAlertTypeLabels[alert.type]}: ${alert.deskName}`}
                  {amount && (
                    <Box
                      component="span"
                      sx={{ ml: 1, fontWeight: 800, color: amount.negative ? brandColors.debt : 'inherit' }}
                    >
                      {amount.text}
                    </Box>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {meta}
                </Typography>
              </Box>
            </ButtonBase>
            <Button
              size="small"
              color="inherit"
              disabled={busy}
              onClick={() => ack([alert.id], () => cashApi.ackAlert(alert.id)).catch(() => undefined)}
              sx={{ minHeight: 40, flexShrink: 0 }}
            >
              Переглянуто
            </Button>
          </Box>
        )
      })}
      {alerts.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            px: { xs: 2, sm: 3 },
            py: 1,
            borderTop: `1px solid ${brandColors.hairline}`,
          }}
        >
          <Button
            size="small"
            disabled={busy}
            onClick={() => ack(alerts.map((a) => a.id), () => cashApi.ackAll()).catch(() => undefined)}
            sx={{ minHeight: 40 }}
          >
            Переглянуто все
          </Button>
        </Box>
      )}
    </>
  )
}
