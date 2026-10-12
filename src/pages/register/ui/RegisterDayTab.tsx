import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useRegisterStore, rowDraft, sameDraft } from '../model/registerStore'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { dailyStatusLabels, dailyStatuses, formatDay, type DailyStatus } from '../../../shared/api'

export const RegisterDayTab = () => {
  const day = useRegisterStore((s) => s.day)
  const draft = useRegisterStore((s) => s.draft)
  const reasons = useRegisterStore((s) => s.reasons)
  const isSaving = useRegisterStore((s) => s.isSaving)
  const dayError = useRegisterStore((s) => s.dayError)
  const loadDay = useRegisterStore((s) => s.loadDay)
  const setDraft = useRegisterStore((s) => s.setDraft)
  const markAllPresent = useRegisterStore((s) => s.markAllPresent)
  const save = useRegisterStore((s) => s.save)
  const [reasonOpen, setReasonOpen] = useState(false)

  if (dayError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadDay().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  if (!day) return <Typography color="text.secondary">Завантаження…</Typography>

  if (!day.working) {
    return <Alert severity="info">Неробочий день{day.calendarTitle ? `: ${day.calendarTitle}` : ''}.</Alert>
  }

  const dirty = day.children.some((row) => draft[row.child.id] && !sameDraft(draft[row.child.id], rowDraft(row)))
  const reasonName = (id: string | null) => reasons.find((r) => r.id === id)?.name ?? ''
  const requiresDocument = (id: string | null) => reasons.find((r) => r.id === id)?.requiresDocument ?? false

  const handleSave = () => {
    if (day.needsReason) {
      setReasonOpen(true)
      return
    }
    save().catch(() => undefined)
  }

  return (
    <Box>
      {!day.canEdit && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Редагування цього дня закрите. Для виправлення зверніться до адміністратора.
        </Alert>
      )}
      {day.canEdit && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={markAllPresent}>Усі присутні</Button>
          <Button variant="contained" disabled={isSaving || !dirty} onClick={handleSave} sx={{ ml: 'auto' }}>
            Зберегти
          </Button>
        </Box>
      )}
      {day.children.length === 0 && <Typography color="text.secondary">У групі немає дітей.</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {day.children.map((row) => {
          const d = draft[row.child.id] ?? rowDraft(row)
          const changed = !sameDraft(d, rowDraft(row))
          return (
            <Paper
              key={row.child.id}
              elevation={0}
              sx={{ border: '1px solid', borderColor: changed ? 'warning.main' : 'divider', borderRadius: 2, p: 1.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, mr: 'auto' }}>
                  {[row.child.lastName, row.child.firstName].join(' ')}
                </Typography>
                {row.notice && (
                  <Chip
                    size="small"
                    color="info"
                    variant="outlined"
                    label={`Повідомили батьки: ${reasonName(row.notice.reasonId) || 'відсутність'}, ${formatDay(row.notice.startDate)}–${formatDay(row.notice.endDate)}`}
                  />
                )}
                {row.mark && (
                  <Typography variant="caption" color="text.secondary">
                    {row.mark.markedBy.lastName} {row.mark.markedBy.firstName}
                  </Typography>
                )}
              </Box>
              <ToggleButtonGroup
                size="small"
                exclusive
                disabled={!day.canEdit}
                value={d.status}
                onChange={(_, value: DailyStatus | null) => {
                  if (value) setDraft(row.child.id, { status: value })
                }}
                sx={{ flexWrap: 'wrap' }}
              >
                {dailyStatuses.map((s) => (
                  <ToggleButton key={s} value={s}>{dailyStatusLabels[s]}</ToggleButton>
                ))}
              </ToggleButtonGroup>
              {d.status === 'absent' && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    label="Причина"
                    disabled={!day.canEdit}
                    value={d.reasonId ?? ''}
                    onChange={(e) => setDraft(row.child.id, { reasonId: e.target.value || null, documentProvided: false })}
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="">Не вказано</MenuItem>
                    {reasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                  </TextField>
                  {requiresDocument(d.reasonId) && (
                    <FormControlLabel
                      disabled={!day.canEdit}
                      control={<Checkbox checked={d.documentProvided} onChange={(e) => setDraft(row.child.id, { documentProvided: e.target.checked })} />}
                      label="Довідку надано"
                    />
                  )}
                </Box>
              )}
              <TextField
                size="small"
                fullWidth
                label="Нотатка"
                disabled={!day.canEdit}
                value={d.note}
                onChange={(e) => setDraft(row.child.id, { note: e.target.value })}
                sx={{ mt: 1.5 }}
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
            </Paper>
          )
        })}
      </Box>
      <ReasonDialog
        open={reasonOpen}
        title="Виправлення журналу"
        subtitle="Термін виправлення для вчителя минув. Вкажіть причину."
        confirmLabel="Зберегти"
        isSaving={isSaving}
        onClose={() => setReasonOpen(false)}
        onSubmit={async (reason) => {
          await save(reason)
          setReasonOpen(false)
        }}
      />
    </Box>
  )
}
