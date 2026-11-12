import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { formatDay, localToday, type NotesDayQuestion } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { draftKey, initialDraft, isChanged, numberError, useNotesStore, type DraftValue } from '../model/notesStore'
import { DateField } from '../../../shared/ui/DateField'

interface QuestionControlProps {
  question: NotesDayQuestion
  value: DraftValue
  disabled: boolean
  onChange: (value: DraftValue) => void
}

const rangeHint = (question: NotesDayQuestion) => {
  if (question.min !== null && question.max !== null) return `від ${question.min} до ${question.max}`
  if (question.min !== null) return `від ${question.min}`
  if (question.max !== null) return `до ${question.max}`
  return undefined
}

const QuestionControl = ({ question, value, disabled, onChange }: QuestionControlProps) => {
  const isPhone = useIsPhone()
  const toggleSx = isPhone ? { minHeight: 44, flexGrow: 1 } : undefined

  if (question.type === 'choice' || question.type === 'percent') {
    const suffix = question.type === 'percent' ? '%' : ''
    return (
      <ToggleButtonGroup
        size="small"
        exclusive
        disabled={disabled}
        value={typeof value === 'string' ? value : null}
        onChange={(_, next: string | null) => onChange(next)}
        sx={{ flexWrap: 'wrap' }}
      >
        {question.options.map((option) => (
          <ToggleButton key={option} value={option} sx={toggleSx}>{option}{suffix}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    )
  }

  if (question.type === 'yes_no') {
    const current = value === true ? 'yes' : value === false ? 'no' : null
    return (
      <ToggleButtonGroup
        size="small"
        exclusive
        disabled={disabled}
        value={current}
        onChange={(_, next: 'yes' | 'no' | null) => onChange(next === null ? null : next === 'yes')}
      >
        <ToggleButton value="yes" sx={toggleSx}>Так</ToggleButton>
        <ToggleButton value="no" sx={toggleSx}>Ні</ToggleButton>
      </ToggleButtonGroup>
    )
  }

  if (question.type === 'number') {
    const error = numberError(question, value)
    return (
      <TextField
        size="small"
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value.replace(',', '.'))}
        error={!!error}
        helperText={error ?? rangeHint(question)}
        sx={{ width: { xs: '100%', sm: 200 } }}
        slotProps={{
          htmlInput: { inputMode: 'decimal', maxLength: 12 },
          input: question.unit ? { endAdornment: <InputAdornment position="end">{question.unit}</InputAdornment> } : undefined,
        }}
      />
    )
  }

  return (
    <TextField
      size="small"
      fullWidth
      multiline
      minRows={1}
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{ htmlInput: { maxLength: 1000 } }}
    />
  )
}

export const FillTab = () => {
  const groups = useNotesStore((s) => s.groups)
  const groupsLoaded = useNotesStore((s) => s.groupsLoaded)
  const groupsError = useNotesStore((s) => s.groupsError)
  const groupId = useNotesStore((s) => s.groupId)
  const date = useNotesStore((s) => s.date)
  const day = useNotesStore((s) => s.day)
  const dayError = useNotesStore((s) => s.dayError)
  const draft = useNotesStore((s) => s.draft)
  const reason = useNotesStore((s) => s.reason)
  const isSaving = useNotesStore((s) => s.isSaving)
  const loadGroups = useNotesStore((s) => s.loadGroups)
  const selectGroup = useNotesStore((s) => s.selectGroup)
  const setDate = useNotesStore((s) => s.setDate)
  const loadDay = useNotesStore((s) => s.loadDay)
  const setAnswer = useNotesStore((s) => s.setAnswer)
  const setReason = useNotesStore((s) => s.setReason)
  const changedAnswers = useNotesStore((s) => s.changedAnswers)
  const hasInvalid = useNotesStore((s) => s.hasInvalid)
  const save = useNotesStore((s) => s.save)
  const hasUnsaved = useNotesStore((s) => s.hasUnsaved)
  const [pendingSwitch, setPendingSwitch] = useState<(() => void) | null>(null)
  const guarded = (apply: () => void) => {
    if (hasUnsaved()) setPendingSwitch(() => apply)
    else apply()
  }
  const manyInstitutions = new Set(groups.map((g) => g.institution.id)).size > 1

  useEffect(() => {
    loadGroups().catch(() => undefined)
  }, [loadGroups])

  useEffect(() => {
    if (groupsLoaded && groupId) loadDay().catch(() => undefined)
  }, [groupsLoaded, groupId, date, loadDay])

  if (groupsError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadGroups().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  if (!groupsLoaded) return <Typography color="text.secondary">Завантаження…</Typography>

  if (groups.length === 0) {
    return <Typography color="text.secondary">Немає груп з активними наборами питань.</Typography>
  }

  const changedCount = day ? changedAnswers().length : 0
  const invalid = day ? hasInvalid() : false
  const reasonMissing = !!day?.needsReason && !reason.trim()

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField select size="small" label="Група" value={groupId ?? ''} onChange={(e) => {
          const next = e.target.value
          if (next !== groupId) guarded(() => selectGroup(next))
        }} sx={{ minWidth: { xs: 0, sm: 220 }, width: { xs: '100%', sm: 'auto' } }}>
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>{manyInstitutions ? `${g.name} · ${g.institution.name}` : g.name}</MenuItem>
          ))}
        </TextField>
        <DateField
          size="small"
          label="Дата"
          value={date}
          onChange={(value) => {
            const next = value
            if (next && next !== date) guarded(() => setDate(next))
          }}
          max={localToday()}
        />
      </Box>

      {dayError && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadDay().catch(() => undefined)}>Спробувати ще</Button>}>
          Не вдалося завантажити дані.
        </Alert>
      )}
      {!dayError && !day && <Typography color="text.secondary">Завантаження…</Typography>}

      {day && (
        <>
          {!day.working && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Неробочий день{day.calendarTitle ? `: ${day.calendarTitle}` : ''}.
            </Alert>
          )}
          {!day.canEdit && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Редагування нотаток за {formatDay(day.date)} закрите. Можна лише переглянути.
            </Alert>
          )}
          {day.canEdit && day.needsReason && (
            <Alert severity="warning" sx={{ mb: 2, '& .MuiAlert-message': { flex: 1 } }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Термін заповнення для педагога минув. Вкажіть причину виправлення.</Typography>
              <TextField
                size="small"
                fullWidth
                label="Причина"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
            </Alert>
          )}
          {day.sets.length === 0 && <Typography color="text.secondary">Для цієї групи немає питань.</Typography>}
          {day.sets.length > 0 && day.children.length === 0 && <Typography color="text.secondary">У групі немає дітей.</Typography>}
          {day.sets.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
              {day.children.map((row) => {
                const rowChanged = day.sets.some((s) =>
                  s.questions.some((q) => {
                    const key = draftKey(row.child.id, q.id)
                    return key in draft && isChanged(q, row, draft[key])
                  }),
                )
                return (
                  <Paper
                    key={row.child.id}
                    elevation={0}
                    sx={{ border: '1px solid', borderColor: rowChanged ? 'warning.main' : 'divider', borderRadius: 2.5, p: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, mr: 'auto' }}>
                        {[row.child.lastName, row.child.firstName].join(' ')}
                      </Typography>
                      {row.absent && <Chip size="small" variant="outlined" label="відсутній" />}
                      {row.complete && (
                        <Chip size="small" color="success" variant="outlined" icon={<CheckCircleIcon />} label="заповнено" />
                      )}
                    </Box>
                    {day.sets.map((noteSet) => (
                      <Box key={noteSet.id} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{noteSet.name}</Typography>
                          <Typography variant="caption" color="text.secondary">до {noteSet.deadline}</Typography>
                          {noteSet.overdue && <Chip size="small" color="error" variant="outlined" label="прострочено" />}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                          {noteSet.questions.map((question) => {
                            const key = draftKey(row.child.id, question.id)
                            const value = key in draft ? draft[key] : initialDraft(question, row)
                            return (
                              <Box key={question.id}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  {question.text}{question.required ? ' *' : ''}
                                </Typography>
                                <QuestionControl
                                  question={question}
                                  value={value}
                                  disabled={!day.canEdit}
                                  onChange={(next) => setAnswer(row.child.id, question.id, next)}
                                />
                              </Box>
                            )
                          })}
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                )
              })}
            </Box>
          )}
          {day.canEdit && day.sets.length > 0 && day.children.length > 0 && (
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 2,
                flexWrap: 'wrap',
                py: 1.5,
                mt: 1.5,
                bgcolor: 'background.default',
              }}
            >
              {changedCount > 0 && (
                <Typography variant="body2" color="text.secondary">Змінено відповідей: {changedCount}</Typography>
              )}
              <Button
                variant="contained"
                disabled={isSaving || changedCount === 0 || invalid || reasonMissing}
                onClick={() => save().catch(() => undefined)}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Зберегти
              </Button>
            </Box>
          )}
        </>
      )}
      <ConfirmDialog
        open={pendingSwitch !== null}
        title="Є незбережені відповіді. Перейти без збереження?"
        confirmLabel="Перейти"
        cancelLabel="Залишитися"
        color="primary"
        onConfirm={() => pendingSwitch?.()}
        onClose={() => setPendingSwitch(null)}
      />
    </Box>
  )
}
