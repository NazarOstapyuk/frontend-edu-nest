import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { formatDay } from '../../../shared/lib/date'
import { DateField } from '../../../shared/ui/DateField'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

export interface ExtendTarget {
  packageId: string
  childName: string
  expiredOn: string
}

const ExtendForm = ({
  target,
  lessonDate,
  isSaving,
  onClose,
  onSubmit,
}: {
  target: ExtendTarget
  lessonDate: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (packageId: string, newExpiresAt: string, reason: string) => Promise<void>
}) => {
  const [until, setUntil] = useState('')
  const [reason, setReason] = useState(`Продовження, щоб відмітити заняття ${formatDay(lessonDate)}`)
  const tooEarly = until !== '' && until < lessonDate
  const canSave = until !== '' && !tooEarly && reason.trim().length > 0

  return (
    <>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography color="text.secondary">
          Пакет дитини {target.childName} закінчився {formatDay(target.expiredOn)}, але заняття в ньому ще лишились.
          Продовжте його хоча б до дня заняття.
        </Typography>
        <DateField
          label="Діє до"
          value={until}
          onChange={setUntil}
          min={lessonDate}
          fullWidth
          error={tooEarly}
          helperText={tooEarly ? `Не раніше ${formatDay(lessonDate)}` : 'Наприклад, до кінця навчального року'}
        />
        <TextField label="Причина" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isSaving}>
          Скасувати
        </Button>
        <Button
          variant="contained"
          disabled={isSaving || !canSave}
          onClick={() =>
            onSubmit(target.packageId, until, reason.trim())
              .then(onClose)
              .catch(() => undefined)
          }
        >
          Продовжити пакет
        </Button>
      </DialogActions>
    </>
  )
}

export const ExtendPackageDialog = ({
  target,
  lessonDate,
  isSaving,
  onClose,
  onSubmit,
}: {
  target: ExtendTarget | null
  lessonDate: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (packageId: string, newExpiresAt: string, reason: string) => Promise<void>
}) => {
  const isPhone = useIsPhone()
  return (
    <Dialog open={!!target} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 800 }}>Продовжити пакет</DialogTitle>
      {target && (
        <ExtendForm
          key={target.packageId}
          target={target}
          lessonDate={lessonDate}
          isSaving={isSaving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Dialog>
  )
}
