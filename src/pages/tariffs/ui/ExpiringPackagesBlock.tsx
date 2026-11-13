import { useEffect, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import { packagesApi } from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { useNotifyStore } from '../../../shared/model/notifyStore'

const packagesWord = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'пакет'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'пакети'
  return 'пакетів'
}

export const ExpiringPackagesBlock = ({ tariffId }: { tariffId: string }) => {
  const [count, setCount] = useState<{ tariffId: string; value: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    packagesApi
      .countWithExpiry(tariffId)
      .then(({ data }) => {
        if (!cancelled) setCount({ tariffId, value: data.count })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [tariffId])

  const value = count?.tariffId === tariffId ? count.value : 0
  if (value === 0) return null

  const clear = async (reason: string) => {
    setIsSaving(true)
    try {
      const { data } = await packagesApi.clearExpiry(tariffId, reason)
      setCount({ tariffId, value: 0 })
      setConfirmOpen(false)
      useNotifyStore.getState().push(`Термін дії знято з ${data.updated} ${packagesWord(data.updated)}`, 'success')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        borderRadius: '14px',
        bgcolor: brandColors.orangeTint,
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
      }}
    >
      <EventBusyOutlinedIcon sx={{ color: brandColors.orangeText, display: { xs: 'none', sm: 'block' } }} />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 800 }}>
          {value} {packagesWord(value)} цього тарифу вже продано з терміном дії
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Зміна терміну в тарифі діє лише на нові пакети. Якщо вже проданим термін не потрібен, зніміть його одразу з
          усіх: вони діятимуть, доки не закінчаться заняття.
        </Typography>
      </Box>
      <Button variant="outlined" onClick={() => setConfirmOpen(true)} sx={{ flexShrink: 0 }}>
        Зняти термін з усіх
      </Button>
      <ReasonDialog
        open={confirmOpen}
        title={`Зняти термін дії з ${value} ${packagesWord(value)}`}
        subtitle="Пакети діятимуть без терміну. Вкажіть причину для журналу змін."
        confirmLabel="Зняти термін"
        isSaving={isSaving}
        onClose={() => setConfirmOpen(false)}
        onSubmit={(reason) => clear(reason)}
      />
    </Box>
  )
}
