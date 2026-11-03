import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { useCan } from '../../../entities/user'
import { FillTab } from './FillTab'
import { QuestionsTab } from './QuestionsTab'

export const NotesPage = () => {
  const canManage = useCan('register', 'edit')
  const [tab, setTab] = useState(0)

  return (
    <Box>
      {canManage && (
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
          <Tab label="Заповнення" />
          <Tab label="Питання" />
        </Tabs>
      )}
      {(tab === 0 || !canManage) && <FillTab />}
      {tab === 1 && canManage && <QuestionsTab />}
    </Box>
  )
}
