import { useState } from 'react'
import { Box, Button, Card, CardContent, Grid, IconButton, Switch, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useScheduleSetupStore } from '../model/scheduleSetupStore'
import { BellScheduleModal } from './BellScheduleModal'
import type { BellSchedule } from '../../../shared/api'

export const BellSchedulesTab = () => {
  const bellSchedules = useScheduleSetupStore((s) => s.bellSchedules)
  const setBellActive = useScheduleSetupStore((s) => s.setBellActive)
  const [editing, setEditing] = useState<BellSchedule | 'new' | null>(null)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Додати розклад дзвінків</Button>
      </Box>
      {bellSchedules.length === 0 && <Typography color="text.secondary">Розкладів дзвінків ще немає.</Typography>}
      <Grid container spacing={2}>
        {bellSchedules.map((b) => (
          <Grid key={b.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, opacity: b.active ? 1 : 0.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, mr: 'auto' }}>{b.name}</Typography>
                  <Switch size="small" checked={b.active} onChange={(e) => setBellActive(b.id, e.target.checked).catch(() => undefined)} />
                  <IconButton size="small" onClick={() => setEditing(b)}><EditOutlinedIcon fontSize="small" /></IconButton>
                </Box>
                {b.periods.map((p) => (
                  <Typography key={p.number} variant="body2">{p.number}-й урок: {p.startTime}–{p.endTime}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <BellScheduleModal open={editing !== null} schedule={editing && editing !== 'new' ? editing : null} onClose={() => setEditing(null)} />
    </Box>
  )
}
