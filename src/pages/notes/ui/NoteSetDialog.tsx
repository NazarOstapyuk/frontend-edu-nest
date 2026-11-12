import { useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import {
  noteQuestionTypeLabels,
  noteQuestionTypes,
  type NoteQuestionDto,
  type NoteQuestionType,
  type NoteSet,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useNotesStore } from '../model/notesStore'

interface QuestionDraft {
  key: string
  id?: string
  text: string
  type: NoteQuestionType
  required: boolean
  options: string[]
  min: string
  max: string
  unit: string
  answered: boolean
}

interface GroupOption {
  id: string
  name: string
}

const BOUND_RE = /^-?\d{1,8}([.,]\d{1,2})?$/
const PERCENT_RE = /^\d{1,3}$/
const DEFAULT_PERCENT_OPTIONS = ['20', '50', '100']

let nextKey = 0
const newKey = () => `new-${++nextKey}`

const emptyQuestion = (): QuestionDraft => ({
  key: newKey(),
  text: '',
  type: 'yes_no',
  required: false,
  options: [],
  min: '',
  max: '',
  unit: '',
  answered: false,
})

const draftsOf = (set: NoteSet | null): QuestionDraft[] =>
  set
    ? set.questions
        .filter((q) => q.active)
        .map((q) => ({
          key: q.id,
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required,
          options: q.options,
          min: q.min === null ? '' : String(q.min),
          max: q.max === null ? '' : String(q.max),
          unit: q.unit ?? '',
          answered: q.answered,
        }))
    : [emptyQuestion()]

const parseBound = (value: string): number | null | undefined => {
  const text = value.trim()
  if (text === '') return null
  if (!BOUND_RE.test(text)) return undefined
  return Number(text.replace(',', '.'))
}

const validate = (name: string, institutionId: string, deadline: string, questions: QuestionDraft[]): string | null => {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 100) return 'Назва має містити від 1 до 100 символів'
  if (!institutionId) return 'Оберіть заклад'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(deadline)) return 'Вкажіть час дедлайну'
  if (questions.length === 0) return 'Додайте хоча б одне питання'
  if (questions.length > 30) return 'Забагато питань (максимум 30)'
  for (const [index, q] of questions.entries()) {
    const label = `Питання ${index + 1}: `
    const text = q.text.trim()
    if (!text || text.length > 300) return `${label}текст має містити від 1 до 300 символів`
    if (q.type === 'choice') {
      const options = q.options.map((o) => o.trim())
      if (options.length < 2 || options.length > 10) return `${label}потрібно від 2 до 10 варіантів`
      if (options.some((o) => !o || o.length > 50)) return `${label}варіант має містити від 1 до 50 символів`
      if (new Set(options).size !== options.length) return `${label}варіанти повторюються`
    }
    if (q.type === 'percent') {
      const options = q.options.map((o) => o.trim())
      if (options.length < 2 || options.length > 10) return `${label}потрібно від 2 до 10 варіантів`
      if (options.some((o) => !PERCENT_RE.test(o) || Number(o) > 100)) return `${label}варіант відсотка: ціле число від 0 до 100`
      if (new Set(options.map(Number)).size !== options.length) return `${label}варіанти повторюються`
    }
    if (q.type === 'number') {
      const min = parseBound(q.min)
      const max = parseBound(q.max)
      if (min === undefined || max === undefined) return `${label}межі мають бути числами, до 2 знаків після коми`
      if (min !== null && max !== null && min > max) return `${label}мінімум більший за максимум`
      if (q.unit.trim().length > 20) return `${label}одиниця виміру має містити до 20 символів`
    }
  }
  return null
}

const toDto = (q: QuestionDraft): NoteQuestionDto => ({
  ...(q.id ? { id: q.id } : {}),
  text: q.text.trim(),
  type: q.type,
  required: q.required,
  options:
    q.type === 'percent'
      ? q.options.map((o) => String(Number(o.trim())))
      : q.type === 'choice'
        ? q.options.map((o) => o.trim())
        : [],
  min: q.type === 'number' ? (parseBound(q.min) ?? null) : null,
  max: q.type === 'number' ? (parseBound(q.max) ?? null) : null,
  unit: q.type === 'number' ? q.unit.trim() || null : null,
})

const NoteSetForm = ({ set, onClose }: { set: NoteSet | null; onClose: () => void }) => {
  const institutions = useNotesStore((s) => s.institutions)
  const registerGroups = useNotesStore((s) => s.registerGroups)
  const isCreating = useNotesStore((s) => s.isCreating)
  const isUpdating = useNotesStore((s) => s.isUpdating)
  const createSet = useNotesStore((s) => s.createSet)
  const updateSet = useNotesStore((s) => s.updateSet)
  const activeInstitutions = institutions.filter((i) => i.isActive)
  const [name, setName] = useState(set?.name ?? '')
  const [institutionId, setInstitutionId] = useState(
    set?.institution.id ?? (activeInstitutions.length === 1 ? activeInstitutions[0].id : ''),
  )
  const [deadline, setDeadline] = useState(set?.deadline ?? '17:00')
  const [groups, setGroups] = useState<GroupOption[]>(set?.groups ?? [])
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => draftsOf(set))
  const [error, setError] = useState<string | null>(null)
  const isSaving = isCreating || isUpdating
  const hiddenCount = set ? set.questions.filter((q) => !q.active).length : 0

  const groupOptions: GroupOption[] = [
    ...registerGroups.filter((g) => g.institutionId === institutionId).map((g) => ({ id: g.id, name: g.name })),
    ...(set?.groups ?? []).filter((g) => !registerGroups.some((r) => r.id === g.id)),
  ]

  const patch = (index: number, change: Partial<QuestionDraft>) =>
    setQuestions((list) => list.map((q, i) => (i === index ? { ...q, ...change } : q)))

  const move = (index: number, shift: number) =>
    setQuestions((list) => {
      const target = index + shift
      if (target < 0 || target >= list.length) return list
      const next = [...list]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const onSave = async () => {
    const problem = validate(name, institutionId, deadline, questions)
    setError(problem)
    if (problem) return
    const payload = {
      name: name.trim(),
      deadline,
      groupIds: groups.map((g) => g.id),
      questions: questions.map(toDto),
    }
    try {
      if (set) await updateSet(set.id, payload)
      else await createSet({ ...payload, institutionId })
      onClose()
    } catch {
      return
    }
  }

  return (
    <>
      <DialogTitle>{set ? 'Редагування набору питань' : 'Новий набір питань'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            size="small"
            fullWidth
            label="Назва"
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            {set ? (
              <TextField size="small" label="Заклад" value={set.institution.name} disabled sx={{ flex: 1 }} />
            ) : (
              <TextField
                select
                size="small"
                label="Заклад"
                value={institutionId}
                onChange={(e) => {
                  setInstitutionId(e.target.value)
                  setGroups([])
                }}
                sx={{ flex: 1 }}
              >
                {activeInstitutions.map((i) => (
                  <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              size="small"
              type="time"
              label="Дедлайн"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 160 } }}
            />
          </Box>
          <Autocomplete
            multiple
            size="small"
            disabled={!institutionId}
            options={groupOptions}
            value={groups}
            onChange={(_, value) => setGroups(value)}
            getOptionLabel={(g) => g.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Немає груп"
            renderInput={(params) => <TextField {...params} label="Групи" />}
          />

          <Typography sx={{ fontWeight: 800 }}>Питання</Typography>
          {hiddenCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              Приховані питання з відповідями: {hiddenCount}. Їхні відповіді збережено.
            </Typography>
          )}
          {questions.map((q, index) => (
            <Paper key={q.key} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>Питання {index + 1}</Typography>
                <Tooltip title="Вище">
                  <span>
                    <IconButton aria-label="Вище" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Нижче">
                  <span>
                    <IconButton aria-label="Нижче" disabled={index === questions.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Видалити питання">
                  <IconButton aria-label="Видалити питання" onClick={() => setQuestions((list) => list.filter((_, i) => i !== index))}>
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 1 }}>
                <TextField
                  size="small"
                  label="Текст питання"
                  value={q.text}
                  onChange={(e) => patch(index, { text: e.target.value })}
                  slotProps={{ htmlInput: { maxLength: 300 } }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  select
                  size="small"
                  label="Тип"
                  value={q.type}
                  disabled={q.answered}
                  helperText={q.answered ? 'Є відповіді' : undefined}
                  onChange={(e) => {
                    const type = e.target.value as NoteQuestionType
                    patch(index, {
                      type,
                      options: type === 'percent' && q.options.length === 0 ? DEFAULT_PERCENT_OPTIONS : q.options,
                    })
                  }}
                  sx={{ width: { xs: '100%', sm: 160 } }}
                >
                  {noteQuestionTypes.map((t) => (
                    <MenuItem key={t} value={t}>{noteQuestionTypeLabels[t]}</MenuItem>
                  ))}
                </TextField>
              </Box>
              {q.type === 'choice' && (
                <Autocomplete
                  multiple
                  freeSolo
                  autoSelect
                  size="small"
                  options={[]}
                  value={q.options}
                  onChange={(_, value) => patch(index, { options: value.map((o) => o.trim()).filter(Boolean) })}
                  renderInput={(params) => (
                    <TextField {...params} label="Варіанти" helperText="Введіть варіант і натисніть Enter (від 2 до 10)" />
                  )}
                  sx={{ mb: 1 }}
                />
              )}
              {q.type === 'percent' && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Варіанти відсотка (від 2 до 10, цілі числа від 0 до 100)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {q.options.map((option, optionIndex) => (
                      <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          size="small"
                          value={option}
                          onChange={(e) =>
                            patch(index, {
                              options: q.options.map((o, i) => (i === optionIndex ? e.target.value.replace(/\D/g, '') : o)),
                            })
                          }
                          slotProps={{
                            htmlInput: { inputMode: 'numeric', maxLength: 3, 'aria-label': `Варіант ${optionIndex + 1}` },
                            input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                          }}
                          sx={{ width: 110 }}
                        />
                        <IconButton
                          aria-label="Видалити варіант"
                          onClick={() => patch(index, { options: q.options.filter((_, i) => i !== optionIndex) })}
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      disabled={q.options.length >= 10}
                      onClick={() => patch(index, { options: [...q.options, ''] })}
                    >
                      + Варіант
                    </Button>
                  </Box>
                </Box>
              )}
              {q.type === 'number' && (
                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Мінімум"
                    value={q.min}
                    onChange={(e) => patch(index, { min: e.target.value.replace(',', '.') })}
                    slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 12 } }}
                  />
                  <TextField
                    size="small"
                    label="Максимум"
                    value={q.max}
                    onChange={(e) => patch(index, { max: e.target.value.replace(',', '.') })}
                    slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 12 } }}
                  />
                  <TextField
                    size="small"
                    label="Одиниця"
                    value={q.unit}
                    onChange={(e) => patch(index, { unit: e.target.value })}
                    slotProps={{ htmlInput: { maxLength: 20 } }}
                  />
                </Box>
              )}
              <FormControlLabel
                control={<Checkbox checked={q.required} onChange={(e) => patch(index, { required: e.target.checked })} />}
                label="Обов'язкове"
              />
              {q.answered && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Якщо видалити питання з відповідями, його буде приховано, а відповіді збережуться.
                </Typography>
              )}
            </Paper>
          ))}
          <Box>
            <Button size="small" disabled={questions.length >= 30} onClick={() => setQuestions((list) => [...list, emptyQuestion()])}>
              + Питання
            </Button>
          </Box>
          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={isSaving}>Скасувати</Button>
        <Button variant="contained" onClick={onSave} disabled={isSaving}>Зберегти</Button>
      </DialogActions>
    </>
  )
}

export const NoteSetDialog = () => {
  const isPhone = useIsPhone()
  const { isOpen, set } = useNotesStore((s) => s.setDialog)
  const setSetDialog = useNotesStore((s) => s.setSetDialog)
  const close = () => setSetDialog({ isOpen: false })

  return (
    <Dialog open={isOpen} onClose={close} fullWidth maxWidth="md" fullScreen={isPhone}>
      {isOpen && <NoteSetForm set={set} onClose={close} />}
    </Dialog>
  )
}
