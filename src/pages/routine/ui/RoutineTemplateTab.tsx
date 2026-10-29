import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  formatDay,
  kyivNow,
  routineApi,
  type RoutineItem,
  type RoutineTemplate,
  type RoutineTemplateItem,
} from '../../../shared/api'
import { useRoutineStore } from '../model/routineStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CopyRoutineDialog } from './CopyRoutineDialog'
import { RoutineItemsEditor } from './RoutineItemsEditor'

const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

interface Draft {
  workingHours: string
  note: string
  items: RoutineTemplateItem[]
}

const toDraft = (t: RoutineTemplate): Draft => ({
  workingHours: t.workingHours ?? '',
  note: t.note ?? '',
  items: t.items.map((i) => ({ ...i })),
})

const versionLabel = (t: RoutineTemplate) =>
  `з ${formatDay(t.validFrom)} ${t.validTo ? `по ${formatDay(t.validTo)}` : '– дотепер'}`

const validate = (items: RoutineTemplateItem[]): string | null => {
  for (let weekday = 1; weekday <= 7; weekday++) {
    const rows = items.filter((i) => i.weekday === weekday)
    const label = dayLabels[weekday - 1]
    if (rows.length > 60) return `${label}: забагато пунктів`
    for (const row of rows) {
      if (!row.startTime || !row.endTime || !row.title.trim()) return `${label}: заповніть час і назву кожного пункту`
      if (row.endTime <= row.startTime) return `${label}: кінець має бути пізніше за початок`
    }
  }
  return null
}

const draftKey = (d: Draft) =>
  JSON.stringify({
    workingHours: d.workingHours,
    note: d.note,
    items: [...d.items].sort((a, b) => a.weekday - b.weekday),
  })

const initialPick = (versions: RoutineTemplate[]) => {
  const today = kyivNow().date
  const current = versions.find((v) => v.validFrom <= today && (!v.validTo || today <= v.validTo))
  return current ?? versions[versions.length - 1] ?? null
}

export const RoutineTemplateTab = ({ groupId }: { groupId: string }) => {
  const isPhone = useIsPhone()
  const reloadSchedule = useRoutineStore((s) => s.load)
  const [versions, setVersions] = useState<RoutineTemplate[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [weekday, setWeekday] = useState(1)
  const [busy, setBusy] = useState(false)
  const [showError, setShowError] = useState(false)
  const [pending, setPending] = useState<(() => void) | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyDayOpen, setCopyDayOpen] = useState(false)

  const selected = versions.find((v) => v.id === selectedId) ?? null
  const selectedRef = useRef<string | null>(null)
  const dirty = !!selected && !!draft && draftKey(toDraft(selected)) !== draftKey(draft)

  const applyList = useCallback((data: RoutineTemplate[], pickId?: string) => {
    const pick = data.find((v) => v.id === pickId) ?? initialPick(data)
    setVersions(data)
    setSelectedId(pick?.id ?? null)
    setDraft(pick ? toDraft(pick) : null)
    setShowError(false)
  }, [])

  const reload = useCallback(
    async (pickId?: string) => {
      const { data } = await routineApi.getTemplates(groupId)
      applyList(data, pickId)
    },
    [groupId, applyList],
  )

  useEffect(() => {
    let active = true
    routineApi
      .getTemplates(groupId)
      .then(({ data }) => {
        if (active) applyList(data)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [groupId, applyList])

  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  const reloadOrFail = (pickId?: string) => reload(pickId).catch(() => setFailed(true))

  const afterChange = () => {
    reloadSchedule().catch(() => undefined)
  }

  const guard = (action: () => void) => (dirty ? setPending(() => action) : action())

  const choose = (id: string) => {
    const version = versions.find((v) => v.id === id)
    if (!version || version.id === selectedId) return
    guard(() => {
      setSelectedId(version.id)
      setDraft(toDraft(version))
      setShowError(false)
    })
  }

  const dayItems = draft ? draft.items.filter((i) => i.weekday === weekday) : []
  const setDayItems = (items: RoutineItem[], target = weekday) =>
    setDraft((d) =>
      d
        ? { ...d, items: [...d.items.filter((i) => i.weekday !== target), ...items.map((i) => ({ ...i, weekday: target }))] }
        : d,
    )

  const error = draft ? validate(draft.items) : null

  const save = async () => {
    if (!selected || !draft) return
    setShowError(true)
    if (error) return
    setBusy(true)
    try {
      const { data } = await routineApi.updateTemplate(selected.id, {
        workingHours: draft.workingHours.trim() || undefined,
        note: draft.note.trim() || undefined,
        items: draft.items.map((i) => ({ ...i, title: i.title.trim() })),
      })
      setVersions((list) => list.map((v) => (v.id === data.id ? data : v)))
      if (selectedRef.current === data.id) {
        setDraft(toDraft(data))
        setShowError(false)
      }
      afterChange()
    } catch {
      return
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!selected) return
    setBusy(true)
    try {
      await routineApi.deleteTemplate(selected.id)
      setDeleting(false)
      afterChange()
      await reloadOrFail()
    } catch {
      return
    } finally {
      setBusy(false)
    }
  }

  const visibleDays = [1, 2, 3, 4, 5, 6, 7].filter(
    (d) => d <= 5 || d === weekday || (draft?.items.some((i) => i.weekday === d) ?? false),
  )

  if (!loaded) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
  if (failed) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => reload().then(() => setFailed(false)).catch(() => undefined)}
          >
            Спробувати ще
          </Button>
        }
      >
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        {versions.length > 0 && (
          <TextField select size="small" disabled={busy} label="Версія" value={selectedId ?? ''} onChange={(e) => choose(e.target.value)} sx={{ minWidth: { xs: 0, sm: 260 }, width: { xs: '100%', sm: 'auto' } }}>
            {versions.map((v) => (
              <MenuItem key={v.id} value={v.id}>{versionLabel(v)}</MenuItem>
            ))}
          </TextField>
        )}
        <Button disabled={busy} onClick={() => guard(() => setNewOpen(true))}>Нова версія з дати</Button>
        <Button disabled={busy} onClick={() => guard(() => setCopyOpen(true))}>Скопіювати з іншої групи</Button>
        {selected && <Button color="error" disabled={busy} onClick={() => guard(() => setDeleting(true))}>Видалити версію</Button>}
      </Stack>

      {!selected || !draft ? (
        <Typography color="text.secondary">Версій розпорядку ще немає. Створіть нову або скопіюйте з іншої групи.</Typography>
      ) : (
        <Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
            {visibleDays.map((d) => (
              <Chip
                key={d}
                label={dayLabels[d - 1]}
                color={d === weekday ? 'primary' : 'default'}
                variant={d === weekday ? 'filled' : 'outlined'}
                onClick={() => setWeekday(d)}
              />
            ))}
          </Stack>
          <RoutineItemsEditor value={dayItems} onChange={(items) => setDayItems(items)} />
          <Box sx={{ mt: 1, mb: 2 }}>
            <Button size="small" disabled={dayItems.length === 0} onClick={() => setCopyDayOpen(true)}>Скопіювати день у…</Button>
          </Box>
          <TextField
            fullWidth
            size="small"
            label="Режим роботи"
            value={draft.workingHours}
            onChange={(e) => setDraft({ ...draft, workingHours: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 100 } }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            size="small"
            label="Примітка"
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
            sx={{ mb: 2 }}
          />
          {showError && error && <Typography variant="body2" color="error" sx={{ mb: 1 }}>{error}</Typography>}
          <Button variant="contained" disabled={busy || !dirty} onClick={save}>Зберегти</Button>
        </Box>
      )}

      <Dialog open={pending !== null} onClose={() => setPending(null)} fullScreen={isPhone}>
        <DialogTitle>Відкинути зміни?</DialogTitle>
        <DialogContent>
          <DialogContentText>У версії є незбережені зміни.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Залишитись</Button>
          <Button
            variant="contained"
            onClick={() => {
              const action = pending
              setPending(null)
              action?.()
            }}
          >
            Відкинути
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleting} onClose={() => setDeleting(false)} fullScreen={isPhone}>
        <DialogTitle>Видалити версію?</DialogTitle>
        <DialogContent>
          <DialogContentText>{selected ? `Версію ${versionLabel(selected)} буде видалено.` : ''}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(false)}>Скасувати</Button>
          <Button color="error" variant="contained" disabled={busy} onClick={remove}>Видалити</Button>
        </DialogActions>
      </Dialog>

      <NewVersionDialog
        open={newOpen}
        groupId={groupId}
        base={selected}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          setNewOpen(false)
          reloadOrFail(id)
          afterChange()
        }}
      />

      <CopyDayDialog
        open={copyDayOpen}
        weekday={weekday}
        onClose={() => setCopyDayOpen(false)}
        onApply={(targets) => {
          setDraft((d) =>
            d
              ? {
                  ...d,
                  items: [
                    ...d.items.filter((i) => !targets.includes(i.weekday)),
                    ...targets.flatMap((t) => dayItems.map((i) => ({ ...i, weekday: t }))),
                  ],
                }
              : d,
          )
          setCopyDayOpen(false)
        }}
      />

      <CopyRoutineDialog
        open={copyOpen}
        groupId={groupId}
        onClose={() => setCopyOpen(false)}
        onCopied={(id) => {
          setCopyOpen(false)
          reloadOrFail(id)
          afterChange()
        }}
      />
    </Box>
  )
}

interface NewVersionDialogProps {
  open: boolean
  groupId: string
  base: RoutineTemplate | null
  onClose: () => void
  onCreated: (id: string) => void
}

const NewVersionForm = ({ groupId, base, onClose, onCreated }: Omit<NewVersionDialogProps, 'open'>) => {
  const [validFrom, setValidFrom] = useState(kyivNow().date)
  const [fromCopy, setFromCopy] = useState(!!base)
  const [isSaving, setIsSaving] = useState(false)

  const submit = async () => {
    setIsSaving(true)
    try {
      const { data } = await routineApi.createTemplate(groupId, {
        validFrom,
        workingHours: fromCopy ? (base?.workingHours ?? undefined) : undefined,
        note: fromCopy ? (base?.note ?? undefined) : undefined,
        items: fromCopy && base ? base.items : [],
      })
      onCreated(data.id)
    } catch {
      return
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogTitle>Нова версія з дати</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          type="date"
          label="Діє з"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mt: 1 }}
        />
        {base && (
          <FormControlLabel
            control={<Checkbox checked={fromCopy} onChange={(e) => setFromCopy(e.target.checked)} />}
            label="Почати з копії вибраної версії"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving || !validFrom} onClick={submit}>Створити</Button>
      </DialogActions>
    </>
  )
}

const NewVersionDialog = ({ open, ...rest }: NewVersionDialogProps) => {
  const isPhone = useIsPhone()
  return (
    <Dialog open={open} onClose={rest.onClose} fullWidth maxWidth="xs" fullScreen={isPhone}>
      <NewVersionForm {...rest} />
    </Dialog>
  )
}

interface CopyDayDialogProps {
  open: boolean
  weekday: number
  onClose: () => void
  onApply: (targets: number[]) => void
}

const CopyDayForm = ({ weekday, onClose, onApply }: Omit<CopyDayDialogProps, 'open'>) => {
  const [targets, setTargets] = useState<number[]>([])

  return (
    <>
      <DialogTitle>Скопіювати {dayLabels[weekday - 1]} у…</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1 }}>Пункти вибраних днів буде замінено.</DialogContentText>
        <Stack>
          {[1, 2, 3, 4, 5, 6, 7].filter((d) => d !== weekday).map((d) => (
            <FormControlLabel
              key={d}
              label={dayLabels[d - 1]}
              control={
                <Checkbox
                  checked={targets.includes(d)}
                  onChange={(e) => setTargets(e.target.checked ? [...targets, d] : targets.filter((t) => t !== d))}
                />
              }
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={targets.length === 0} onClick={() => onApply(targets)}>Скопіювати</Button>
      </DialogActions>
    </>
  )
}

const CopyDayDialog = ({ open, ...rest }: CopyDayDialogProps) => {
  const isPhone = useIsPhone()
  return (
    <Dialog open={open} onClose={rest.onClose} fullWidth maxWidth="xs" fullScreen={isPhone}>
      <CopyDayForm {...rest} />
    </Dialog>
  )
}
