import { useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useScheduleStore, isEditableVersion } from '../model/scheduleStore'
import { EntryModal } from './EntryModal'
import { conflictText, formatDay, localToday, weekParityLabels, weekdayLabels, type TimetableEntry } from '../../../shared/api'

const WEEKDAYS = [1, 2, 3, 4, 5, 6]

export const TimetableTab = () => {
  const classes = useScheduleStore((s) => s.classes)
  const classId = useScheduleStore((s) => s.classId)
  const bellSchedules = useScheduleStore((s) => s.bellSchedules)
  const versions = useScheduleStore((s) => s.versions)
  const versionId = useScheduleStore((s) => s.versionId)
  const draft = useScheduleStore((s) => s.draft)
  const conflicts = useScheduleStore((s) => s.conflicts)
  const subjects = useScheduleStore((s) => s.subjects)
  const teachers = useScheduleStore((s) => s.teachers)
  const rooms = useScheduleStore((s) => s.rooms)
  const subgroups = useScheduleStore((s) => s.subgroups)
  const newValidFrom = useScheduleStore((s) => s.newValidFrom)
  const isSaving = useScheduleStore((s) => s.isSaving)
  const selectVersion = useScheduleStore((s) => s.selectVersion)
  const startNewVersion = useScheduleStore((s) => s.startNewVersion)
  const setDraft = useScheduleStore((s) => s.setDraft)
  const saveVersion = useScheduleStore((s) => s.saveVersion)
  const [cell, setCell] = useState<{ weekday: number; period: number; index: number | null } | null>(null)
  const [validFrom, setValidFrom] = useState(localToday())

  const cls = classes.find((c) => c.id === classId)
  const periods = useMemo(
    () => bellSchedules.find((b) => b.id === cls?.bellScheduleId)?.periods ?? [],
    [bellSchedules, cls?.bellScheduleId],
  )
  const editable = isEditableVersion(versionId, versions)
  const name = (list: { id: string; name: string }[], id: string | null) => (id ? (list.find((x) => x.id === id)?.name ?? '') : '')
  const teacherName = (id: string) => {
    const t = teachers.find((x) => x.id === id)
    return t ? `${t.lastName} ${t.firstName[0]}.` : ''
  }
  const conflicted = (weekday: number, period: number) =>
    conflicts.some((c) => c.weekday === weekday && c.period === period && c.groupName === cls?.name)

  if (!cls) return null
  if (!cls.bellScheduleId) return <Alert severity="info">Спочатку оберіть класу розклад дзвінків (Групи → редагувати клас).</Alert>

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField select size="small" label="Версія" value={versionId ?? ''} onChange={(e) => selectVersion(e.target.value)} sx={{ minWidth: 240 }}>
          {versions.map((v) => (
            <MenuItem key={v.id} value={v.id}>з {formatDay(v.validFrom)}{v.validTo ? ` по ${formatDay(v.validTo)}` : ''}</MenuItem>
          ))}
          {versionId === 'new' && <MenuItem value="new">Нова з {formatDay(newValidFrom)}</MenuItem>}
        </TextField>
        <TextField size="small" type="date" label="Нова версія з" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <Button variant="outlined" disabled={!validFrom} onClick={() => startNewVersion(validFrom)}>Нова версія</Button>
        {editable && (
          <Button variant="contained" disabled={isSaving} onClick={() => saveVersion().catch(() => undefined)} sx={{ ml: 'auto' }}>Зберегти</Button>
        )}
      </Box>
      {!editable && versionId && <Alert severity="info" sx={{ mb: 2 }}>Ця версія вже діє. Щоб змінити розклад, створіть нову версію з потрібної дати.</Alert>}
      {versions.length === 0 && versionId === null && <Typography color="text.secondary" sx={{ mb: 2 }}>Розкладу ще немає. Створіть першу версію.</Typography>}
      {conflicts.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {conflicts.map((c, i) => <div key={i}>{conflictText(c)}</div>)}
        </Alert>
      )}
      {versionId && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Урок</TableCell>
                {WEEKDAYS.map((d) => <TableCell key={d}>{weekdayLabels[d - 1]}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.map((p) => (
                <TableRow key={p.number}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.number}<Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">{p.startTime}–{p.endTime}</Typography></TableCell>
                  {WEEKDAYS.map((d) => {
                    const items = draft.map((e, index) => ({ e, index })).filter(({ e }) => e.weekday === d && e.period === p.number)
                    return (
                      <TableCell
                        key={d}
                        onClick={() => editable && setCell({ weekday: d, period: p.number, index: null })}
                        sx={{ verticalAlign: 'top', minWidth: 140, cursor: editable ? 'pointer' : 'default', bgcolor: conflicted(d, p.number) ? 'rgba(211, 47, 47, 0.12)' : undefined }}
                      >
                        {items.map(({ e, index }) => (
                          <Box
                            key={index}
                            onClick={(ev) => { ev.stopPropagation(); if (editable) setCell({ weekday: d, period: p.number, index }) }}
                            sx={{ mb: 0.5, p: 0.5, borderRadius: 1, bgcolor: 'grey.50' }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{name(subjects, e.subjectId)}</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>{teacherName(e.teacherId)}{e.roomId ? `, ${name(rooms, e.roomId)}` : ''}</Typography>
                            {e.subgroupId && <Chip size="small" label={name(subgroups, e.subgroupId)} sx={{ mr: 0.5 }} />}
                            {e.parity !== 'every' && <Chip size="small" variant="outlined" label={weekParityLabels[e.parity]} />}
                          </Box>
                        ))}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      {cell && (
        <EntryModal
          open
          weekday={cell.weekday}
          period={cell.period}
          entry={cell.index === null ? null : draft[cell.index]}
          onClose={() => setCell(null)}
          onSave={(entry: TimetableEntry) =>
            setDraft(cell.index === null ? [...draft, entry] : draft.map((e, i) => (i === cell.index ? entry : e)))
          }
          onDelete={() => setDraft(draft.filter((_, i) => i !== cell.index))}
        />
      )}
    </Box>
  )
}
