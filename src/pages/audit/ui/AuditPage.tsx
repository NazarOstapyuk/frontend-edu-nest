import { useState } from 'react'
import { Stack, Tab, Tabs } from '@mui/material'
import { EventsTab } from './EventsTab'
import { LoginsTab } from './LoginsTab'
import { EventDialog } from './EventDialog'

export const AuditPage = () => {
  const [tab, setTab] = useState(0)

  return (
    <Stack spacing={2}>
      <Tabs value={tab} onChange={(_, value: number) => setTab(value)}>
        <Tab label="Дії" />
        <Tab label="Входи" />
      </Tabs>
      {tab === 0 ? <EventsTab /> : <LoginsTab />}
      <EventDialog />
    </Stack>
  )
}
