import { useState } from 'react'
import { Box, Button, Chip, IconButton, MenuItem, Paper, Switch, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useScheduleSetupStore } from '../model/scheduleSetupStore'
import { SubgroupModal } from './SubgroupModal'
import type { Subgroup } from '../../../shared/api'

export const SubgroupsTab = () => {
  const classes = useScheduleSetupStore((s) => s.classes)
  const classId = useScheduleSetupStore((s) => s.classId)
  const subgroups = useScheduleSetupStore((s) => s.subgroups)
  const selectClass = useScheduleSetupStore((s) => s.selectClass)
  const setSubgroupActive = useScheduleSetupStore((s) => s.setSubgroupActive)
  const [editing, setEditing] = useState<Subgroup | 'new' | null>(null)

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <TextField select size="small" label="Клас" value={classId ?? ''} onChange={(e) => selectClass(e.target.value).catch(() => undefined)} sx={{ minWidth: 200 }}>
          {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <Button variant="contained" startIcon={<AddIcon />} disabled={!classId} onClick={() => setEditing('new')} sx={{ ml: 'auto' }}>
          Додати підгрупу
        </Button>
      </Box>
      {classes.length === 0 && <Typography color="text.secondary">Немає класів. Поставте групі тип «Клас».</Typography>}
      {classId && subgroups.length === 0 && <Typography color="text.secondary">Підгруп ще немає.</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {subgroups.map((sg) => (
          <Paper key={sg.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, opacity: sg.active ? 1 : 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontWeight: 600, mr: 'auto' }}>{sg.name}</Typography>
              <Switch size="small" checked={sg.active} onChange={(e) => setSubgroupActive(sg.id, e.target.checked).catch(() => undefined)} />
              <IconButton size="small" onClick={() => setEditing(sg)}><EditOutlinedIcon fontSize="small" /></IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {sg.children.map((c) => <Chip key={c.id} size="small" label={`${c.lastName} ${c.firstName}`} />)}
            </Box>
          </Paper>
        ))}
      </Box>
      <SubgroupModal open={editing !== null} subgroup={editing && editing !== 'new' ? editing : null} onClose={() => setEditing(null)} />
    </Box>
  )
}
