import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material'
import { formatMoney, packageExpiryFor, type LessonRoster } from '../../../shared/api'
import { formatDay } from '../../../shared/lib/date'
import { DateField } from '../../../shared/ui/DateField'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { brandColors } from '../../../shared/assets/brand'

export interface SellCandidate {
  id: string
  name: string
  reason: string
  preselected: boolean
}

type Tariff = NonNullable<LessonRoster['packageTariff']>

const sessionsWord = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'заняття'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'заняття'
  return 'занять'
}

const packagesWord = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'пакет'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'пакети'
  return 'пакетів'
}

const SellPackagesForm = ({
  candidates,
  tariff,
  lessonDate,
  isSaving,
  onClose,
  onSubmit,
}: {
  candidates: SellCandidate[]
  tariff: Tariff
  lessonDate: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (childIds: string[], purchaseDate: string, expiresAt: string | null) => Promise<void>
}) => {
  const [selected, setSelected] = useState<string[]>(candidates.filter((c) => c.preselected).map((c) => c.id))
  const [purchaseDate, setPurchaseDate] = useState(lessonDate)
  const [expiresAt, setExpiresAt] = useState(packageExpiryFor(lessonDate, tariff.validityDays))
  const expiryTooEarly = expiresAt !== '' && expiresAt < lessonDate
  const allSelected = selected.length === candidates.length
  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  const dateTooLate = purchaseDate > lessonDate

  const submit = () => {
    onSubmit(
      candidates.filter((c) => selected.includes(c.id)).map((c) => c.id),
      purchaseDate,
      expiresAt || null,
    )
      .then(onClose)
      .catch(() => undefined)
  }

  return (
    <>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ bgcolor: brandColors.oliveTint, borderRadius: '14px', p: 2 }}>
          <Typography sx={{ fontWeight: 800 }}>{tariff.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {tariff.packageSize} {sessionsWord(tariff.packageSize)}
            {tariff.price ? `, ${formatMoney(tariff.price)}` : ', ціни на цю дату немає'}
            {tariff.validityDays ? `, за тарифом діє ${tariff.validityDays} дн.` : ', за тарифом без терміну'}
          </Typography>
        </Box>

        <DateField
          label="Дата покупки"
          value={purchaseDate}
          onChange={(value) => {
            setPurchaseDate(value)
            setExpiresAt(packageExpiryFor(value, tariff.validityDays))
          }}
          fullWidth
          error={dateTooLate}
          helperText={
            dateTooLate
              ? `Пакет почне діяти пізніше заняття ${formatDay(lessonDate)}, і дітей усе одно не можна буде відмітити`
              : 'Пакет діє з цієї дати. Щоб відмітити це заняття, дата має бути не пізніше дня заняття.'
          }
        />

        <DateField
          label="Діє до"
          value={expiresAt}
          onChange={setExpiresAt}
          min={purchaseDate}
          clearable
          fullWidth
          error={expiryTooEarly}
          helperText={
            expiryTooEarly
              ? `Пакет закінчиться до заняття ${formatDay(lessonDate)}, і дітей не можна буде відмітити`
              : expiresAt
                ? 'Очистіть поле, щоб пакет діяв без терміну, доки не закінчаться заняття'
                : 'Без терміну: пакет діє, доки не закінчаться заняття'
          }
        />

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700 }}>Кому продати</Typography>
            <Button
              size="small"
              onClick={() => setSelected(allSelected ? [] : candidates.map((c) => c.id))}
              sx={{ minHeight: 32 }}
            >
              {allSelected ? 'Зняти всіх' : 'Вибрати всіх'}
            </Button>
          </Box>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}>
            {candidates.map((c) => (
              <FormControlLabel
                key={c.id}
                sx={{
                  m: 0,
                  px: 1,
                  py: 0.5,
                  width: '100%',
                  alignItems: 'flex-start',
                  '&:not(:last-of-type)': { borderBottom: 1, borderColor: 'divider' },
                }}
                control={<Checkbox checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />}
                label={
                  <Box sx={{ py: 1 }}>
                    <Typography>{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.reason}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Кожному вибраному створиться нарахування за пакет, батьки побачать його в кабінеті. Коли заняття в пакеті
          закінчаться, наступний пакет нарахується автоматично.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isSaving}>
          Скасувати
        </Button>
        <Button variant="contained" onClick={submit} disabled={isSaving || selected.length === 0 || dateTooLate || expiryTooEarly}>
          {selected.length === 0
            ? 'Виберіть дітей'
            : `Продати ${selected.length} ${packagesWord(selected.length)}`}
        </Button>
      </DialogActions>
    </>
  )
}

export const SellPackagesDialog = ({
  open,
  candidates,
  tariff,
  lessonDate,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean
  candidates: SellCandidate[]
  tariff: Tariff
  lessonDate: string
  isSaving: boolean
  onClose: () => void
  onSubmit: (childIds: string[], purchaseDate: string, expiresAt: string | null) => Promise<void>
}) => {
  const isPhone = useIsPhone()
  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 800 }}>Продати пакет</DialogTitle>
      {open && (
        <SellPackagesForm
          key={candidates.map((c) => `${c.id}:${c.preselected}`).join(',')}
          candidates={candidates}
          tariff={tariff}
          lessonDate={lessonDate}
          isSaving={isSaving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Dialog>
  )
}
