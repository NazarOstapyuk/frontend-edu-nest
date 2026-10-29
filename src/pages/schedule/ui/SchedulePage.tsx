import { useEffect, useState } from 'react'
import { Alert, Box, Button, MenuItem, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useScheduleStore } from '../model/scheduleStore'
import { TimetableTab } from './TimetableTab'
import { WeekTab } from './WeekTab'

export const SchedulePage = () => {
  const classes = useScheduleStore((s) => s.classes)
  const classId = useScheduleStore((s) => s.classId)
  const metaFailed = useScheduleStore((s) => s.metaFailed)
  const classFailed = useScheduleStore((s) => s.classFailed)
  const loadMeta = useScheduleStore((s) => s.loadMeta)
  const selectClass = useScheduleStore((s) => s.selectClass)
  const setClassId = useScheduleStore((s) => s.setClassId)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    loadMeta().catch(() => undefined)
  }, [loadMeta])

  useEffect(() => {
    if (classId) selectClass(classId).catch(() => undefined)
  }, [classId, selectClass])

  if (metaFailed) {
    return <Alert severity="error" action={<Button onClick={() => loadMeta().catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
  }
  if (classes.length === 0) return <Typography color="text.secondary">Немає шкільних класів. Поставте групі тип «Клас».</Typography>

  return (
    <Box>
      <TextField select size="small" label="Клас" value={classId ?? ''} onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: { xs: 0, sm: 200 }, width: { xs: '100%', sm: 'auto' }, mb: 2 }}>
        {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
      </TextField>
      {classFailed && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => classId && selectClass(classId).catch(() => undefined)}>Спробувати ще</Button>}>
          Не вдалося завантажити дані.
        </Alert>
      )}
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
        <Tab label="Розклад" />
        <Tab label="Тиждень" />
      </Tabs>
      {tab === 0 && <TimetableTab />}
      {tab === 1 && <WeekTab />}
    </Box>
  )
}
