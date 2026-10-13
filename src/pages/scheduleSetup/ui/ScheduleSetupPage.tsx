import { useEffect, useState } from 'react'
import { Alert, Box, Button, Tab, Tabs } from '@mui/material'
import { useScheduleSetupStore } from '../model/scheduleSetupStore'
import { NamedTab } from './NamedTab'
import { BellSchedulesTab } from './BellSchedulesTab'
import { SubgroupsTab } from './SubgroupsTab'

export const ScheduleSetupPage = () => {
  const load = useScheduleSetupStore((s) => s.load)
  const loadFailed = useScheduleSetupStore((s) => s.loadFailed)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  if (loadFailed) {
    return (
      <Alert severity="error" action={<Button onClick={() => load().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
        <Tab label="Предмети" />
        <Tab label="Кабінети" />
        <Tab label="Дзвінки" />
        <Tab label="Підгрупи" />
      </Tabs>
      {tab === 0 && <NamedTab kind="subject" />}
      {tab === 1 && <NamedTab kind="room" />}
      {tab === 2 && <BellSchedulesTab />}
      {tab === 3 && <SubgroupsTab />}
    </Box>
  )
}
