import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { useAuthStore } from '../../../entities/user'
import { MyTasksTab } from './MyTasksTab'
import { GivenTasksTab } from './GivenTasksTab'

type TasksTab = 'mine' | 'given'

export const TasksPage = () => {
  const role = useAuthStore((s) => s.profile?.role)
  const canGive = role === 'root' || role === 'admin'
  const hasMine = role !== 'root'
  const [tab, setTab] = useState<TasksTab>(hasMine ? 'mine' : 'given')
  const current: TasksTab = !canGive ? 'mine' : !hasMine ? 'given' : tab

  return (
    <Box>
      {canGive && hasMine && (
        <Tabs value={current} onChange={(_, v: TasksTab) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
          <Tab value="mine" label="Мої" />
          <Tab value="given" label="Поставлені" />
        </Tabs>
      )}
      {current === 'mine' && <MyTasksTab />}
      {current === 'given' && <GivenTasksTab />}
    </Box>
  )
}
