import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, IconButton, MenuItem, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useLessonStore, pupilBaseline, sameDraft } from '../model/lessonStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { formatDay, lessonStatusLabels, lessonStatuses, nushLevelLabels, nushLevels, type LessonStatus, type NushLevel } from '../../../shared/api'

export const LessonPage = () => {
  const { groupId = '', date = '', period = '' } = useParams<{ groupId: string; date: string; period: string }>()
  const [search] = useSearchParams()
  const subgroupId = search.get('subgroupId') ?? undefined
  const navigate = useNavigate()
  const view = useLessonStore((s) => s.view)
  const key = useLessonStore((s) => s.key)
  const draft = useLessonStore((s) => s.draft)
  const reasons = useLessonStore((s) => s.reasons)
  const topic = useLessonStore((s) => s.topic)
  const homework = useLessonStore((s) => s.homework)
  const loadFailed = useLessonStore((s) => s.loadFailed)
  const isSaving = useLessonStore((s) => s.isSaving)
  const load = useLessonStore((s) => s.load)
  const setPupil = useLessonStore((s) => s.setPupil)
  const setTopic = useLessonStore((s) => s.setTopic)
  const setHomework = useLessonStore((s) => s.setHomework)
  const markAllPresent = useLessonStore((s) => s.markAllPresent)
  const save = useLessonStore((s) => s.save)
  const isPhone = useIsPhone()
  const toggleSx = isPhone ? { minHeight: 44 } : undefined
  const btnSx = isPhone ? { minHeight: 40 } : undefined
  const [reasonOpen, setReasonOpen] = useState(false)
  const ref = { groupId, date, period: Number(period), subgroupId }
  const expectedKey = `${groupId}/${date}/${period}/${subgroupId ?? 'class'}`

  useEffect(() => {
    load({ groupId, date, period: Number(period), subgroupId }).catch(() => undefined)
  }, [groupId, date, period, subgroupId, load])

  if (loadFailed && key === expectedKey) {
    return <Alert severity="error" action={<Button onClick={() => load(ref).catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
  }
  if (!view || key !== expectedKey) return <Typography color="text.secondary">Завантаження…</Typography>

  const dirty =
    view.pupils.some((p) => draft[p.child.id] && !sameDraft(draft[p.child.id], pupilBaseline(p))) ||
    topic.trim() !== (view.lesson?.topic ?? '') ||
    homework.trim() !== (view.lesson?.homework ?? '')
  const reasonOptions = (current: string | null) => reasons.filter((r) => r.active || r.id === current)

  const handleSave = () => {
    if (view.needsReason) {
      setReasonOpen(true)
      return
    }
    save().catch(() => undefined)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{view.slot.subjectName}, {view.group.name}{view.slot.subgroupName ? ` (${view.slot.subgroupName})` : ''}</Typography>
          <Typography variant="body2" color="text.secondary">{formatDay(view.date)}, {view.slot.period}-й урок, {view.slot.startTime}–{view.slot.endTime}</Typography>
        </Box>
        {view.canEdit && <Button variant="outlined" sx={btnSx} onClick={markAllPresent}>Усі присутні</Button>}
        {view.canEdit && <Button variant="contained" sx={btnSx} disabled={isSaving || !dirty} onClick={handleSave}>Зберегти</Button>}
      </Box>
      {!view.canEdit && <Alert severity="warning" sx={{ mb: 2 }}>Редагування цього уроку закрите.</Alert>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <TextField label="Тема уроку" value={topic} disabled={!view.canEdit} onChange={(e) => setTopic(e.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
        <TextField label="Домашнє завдання" value={homework} disabled={!view.canEdit} multiline minRows={2} onChange={(e) => setHomework(e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {view.pupils.map((p) => {
          const d = draft[p.child.id] ?? pupilBaseline(p)
          const changed = !sameDraft(d, pupilBaseline(p))
          return (
            <Paper key={p.child.id} elevation={0} sx={{ border: '1px solid', borderColor: changed ? 'warning.main' : 'divider', borderRadius: 2, p: 1.5, opacity: p.state.source === 'register' && !changed ? 0.7 : 1 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                {p.child.lastName} {p.child.firstName}
                {p.state.source === 'register' && <Typography component="span" variant="caption" color="text.secondary"> · відсутній за журналом</Typography>}
              </Typography>
              <ToggleButtonGroup size="small" exclusive disabled={!view.canEdit} value={d.status} onChange={(_, v: LessonStatus | null) => v && setPupil(p.child.id, { status: v })} sx={{ flexWrap: 'wrap' }}>
                {lessonStatuses.map((s) => <ToggleButton key={s} value={s} sx={toggleSx}>{lessonStatusLabels[s]}</ToggleButton>)}
              </ToggleButtonGroup>
              {d.status === 'absent' && (
                <TextField select size="small" label="Причина" disabled={!view.canEdit} value={d.reasonId ?? ''} onChange={(e) => setPupil(p.child.id, { reasonId: e.target.value || null })} sx={{ mt: 1.5, minWidth: { xs: 0, sm: 220 }, display: 'flex' }}>
                  <MenuItem value="">Не вказано</MenuItem>
                  {reasonOptions(d.reasonId).map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </TextField>
              )}
              {d.status && d.status !== 'absent' && (
                <ToggleButtonGroup size="small" exclusive disabled={!view.canEdit} value={d.level} onChange={(_, v: NushLevel | null) => setPupil(p.child.id, { level: v })} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                  {nushLevels.map((l) => <ToggleButton key={l} value={l} sx={{ textTransform: 'none', ...toggleSx }}>{nushLevelLabels[l]}</ToggleButton>)}
                </ToggleButtonGroup>
              )}
              <TextField size="small" fullWidth label="Коментар (бачать батьки)" disabled={!view.canEdit} value={d.comment} onChange={(e) => setPupil(p.child.id, { comment: e.target.value })} sx={{ mt: 1.5 }} slotProps={{ htmlInput: { maxLength: 500 } }} />
            </Paper>
          )
        })}
      </Box>
      <ReasonDialog
        open={reasonOpen}
        title="Виправлення уроку"
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
