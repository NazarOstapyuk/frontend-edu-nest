import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, IconButton, MenuItem, Tab, Tabs, TextField, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { addDaysIso, formatDay } from '../../../shared/api'
import { useRoutineStore } from '../model/routineStore'
import { DayOverrideDialog } from './DayOverrideDialog'
import { RoutineScheduleTab } from './RoutineScheduleTab'

export const RoutinePage = () => {
  const groups = useRoutineStore((s) => s.groups)
  const groupId = useRoutineStore((s) => s.groupId)
  const weekFrom = useRoutineStore((s) => s.weekFrom)
  const groupsLoaded = useRoutineStore((s) => s.groupsLoaded)
  const metaError = useRoutineStore((s) => s.metaError)
  const loadMeta = useRoutineStore((s) => s.loadMeta)
  const selectGroup = useRoutineStore((s) => s.selectGroup)
  const shiftWeek = useRoutineStore((s) => s.shiftWeek)
  const load = useRoutineStore((s) => s.load)
  const [tab, setTab] = useState(0)
  const manyInstitutions = new Set(groups.map((g) => g.institution.id)).size > 1

  useEffect(() => {
    loadMeta().catch(() => undefined)
  }, [loadMeta])

  useEffect(() => {
    if (groupId) load().catch(() => undefined)
  }, [groupId, weekFrom, load])

  if (metaError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadMeta().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  if (!groupsLoaded) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
  }

  if (groups.length === 0) {
    return <Typography color="text.secondary">Немає садкових груп, доступних для розпорядку дня.</Typography>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField select size="small" label="Група" value={groupId ?? ''} onChange={(e) => selectGroup(e.target.value)} sx={{ minWidth: 220 }}>
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>{manyInstitutions ? `${g.name} · ${g.institution.name}` : g.name}</MenuItem>
          ))}
        </TextField>
        {tab === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton aria-label="Попередній тиждень" onClick={() => shiftWeek(-1)}><ChevronLeftIcon /></IconButton>
            <Typography sx={{ minWidth: 160, textAlign: 'center' }}>
              {formatDay(weekFrom)} – {formatDay(addDaysIso(weekFrom, 6))}
            </Typography>
            <IconButton aria-label="Наступний тиждень" onClick={() => shiftWeek(1)}><ChevronRightIcon /></IconButton>
          </Box>
        )}
      </Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Розклад" />
      </Tabs>
      {tab === 0 && <RoutineScheduleTab />}
      <DayOverrideDialog />
    </Box>
  )
}
