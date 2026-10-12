import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, IconButton, Tab, Tabs, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useFamilyChildStore } from '../model/familyChildStore'
import { ChildCardTab } from './ChildCardTab'
import { VisitsTab } from './VisitsTab'
import { ChildFinanceTab } from './ChildFinanceTab'

export const FamilyChildPage = () => {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const card = useFamilyChildStore((s) => s.card)
  const finance = useFamilyChildStore((s) => s.finance)
  const storeChildId = useFamilyChildStore((s) => s.childId)
  const isLoading = useFamilyChildStore((s) => s.isLoading)
  const fetchChild = useFamilyChildStore((s) => s.fetchChild)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (childId) fetchChild(childId).catch(() => undefined)
  }, [childId, fetchChild])

  if (!card || !finance || storeChildId !== childId) {
    return (
      <Typography color="text.secondary">
        {isLoading || storeChildId !== childId ? 'Завантаження…' : 'Дитину не знайдено.'}
      </Typography>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/family')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {[card.lastName, card.firstName, card.middleName].filter(Boolean).join(' ')}
        </Typography>
      </Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
        <Tab label="Картка" />
        <Tab label="Відвідування" />
        <Tab label="Фінанси" />
      </Tabs>
      {tab === 0 && <ChildCardTab card={card} />}
      {tab === 1 && <VisitsTab visits={card.visits} />}
      {tab === 2 && <ChildFinanceTab finance={finance} />}
    </Box>
  )
}
