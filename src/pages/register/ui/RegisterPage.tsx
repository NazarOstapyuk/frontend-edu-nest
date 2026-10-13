import { useEffect, useState } from 'react'
import { Alert, Box, Button, IconButton, MenuItem, Tab, Tabs, TextField, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useRegisterStore } from '../model/registerStore'
import { RegisterDayTab } from './RegisterDayTab'
import { MealsTodayBlock } from './MealsTodayBlock'
import { RegisterMonthTab } from './RegisterMonthTab'
import { groupKindLabels, localToday, monthLabel, shiftMonth } from '../../../shared/api'

export const RegisterPage = () => {
  const groups = useRegisterStore((s) => s.groups)
  const groupId = useRegisterStore((s) => s.groupId)
  const date = useRegisterStore((s) => s.date)
  const month = useRegisterStore((s) => s.month)
  const metaError = useRegisterStore((s) => s.metaError)
  const loadMeta = useRegisterStore((s) => s.loadMeta)
  const selectGroup = useRegisterStore((s) => s.selectGroup)
  const setDate = useRegisterStore((s) => s.setDate)
  const setMonth = useRegisterStore((s) => s.setMonth)
  const loadDay = useRegisterStore((s) => s.loadDay)
  const loadMonth = useRegisterStore((s) => s.loadMonth)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    loadMeta().catch(() => undefined)
  }, [loadMeta])

  useEffect(() => {
    if (groupId && tab === 0) loadDay().catch(() => undefined)
  }, [groupId, date, tab, loadDay])

  useEffect(() => {
    if (groupId && tab === 1) loadMonth().catch(() => undefined)
  }, [groupId, month, tab, loadMonth])

  if (metaError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadMeta().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  if (groups.length === 0) {
    return <Typography color="text.secondary">Немає груп, доступних для журналу.</Typography>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField select size="small" label="Група" value={groupId ?? ''} onChange={(e) => selectGroup(e.target.value)} sx={{ minWidth: 220 }}>
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>{g.name} · {groupKindLabels[g.kind]}</MenuItem>
          ))}
        </TextField>
        {tab === 0 ? (
          <TextField
            size="small"
            type="date"
            label="Дата"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: localToday() } }}
          />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeftIcon /></IconButton>
            <Typography sx={{ minWidth: 140, textAlign: 'center' }}>{monthLabel(month)}</Typography>
            <IconButton onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRightIcon /></IconButton>
          </Box>
        )}
      </Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="День" />
        <Tab label="Табель" />
      </Tabs>
      {tab === 0 && <RegisterDayTab />}
      {tab === 0 && groupId && date === localToday() && <MealsTodayBlock groupId={groupId} />}
      {tab === 1 && (
        <RegisterMonthTab
          onOpenDay={(day) => {
            setDate(day)
            setTab(0)
          }}
        />
      )}
    </Box>
  )
}
