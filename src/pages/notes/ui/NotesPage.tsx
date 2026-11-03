import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Tab, Tabs } from '@mui/material'
import { useCan } from '../../../entities/user'
import { localToday } from '../../../shared/api'
import { useNotesStore } from '../model/notesStore'
import { FillTab } from './FillTab'
import { QuestionsTab } from './QuestionsTab'

export const NotesPage = () => {
  const canManage = useCan('register', 'edit')
  const [tab, setTab] = useState(0)
  const [searchParams] = useSearchParams()
  const [requestedGroup] = useState(() => searchParams.get('groupId'))

  useEffect(() => {
    useNotesStore.getState().setDate(localToday())
    if (requestedGroup) useNotesStore.getState().selectGroup(requestedGroup)
  }, [requestedGroup])

  useEffect(() => {
    const follow = () => {
      if (document.visibilityState === 'visible') useNotesStore.getState().followToday()
    }
    document.addEventListener('visibilitychange', follow)
    window.addEventListener('focus', follow)
    return () => {
      document.removeEventListener('visibilitychange', follow)
      window.removeEventListener('focus', follow)
    }
  }, [])

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
