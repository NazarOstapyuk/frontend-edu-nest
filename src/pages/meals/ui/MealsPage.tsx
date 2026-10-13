import { useEffect, useState } from 'react'
import { Alert, Box, Button, Tab, Tabs } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { DirectoriesTab } from './DirectoriesTab'
import { MenuTab } from './MenuTab'
import { TemplatesTab } from './TemplatesTab'

export const MealsPage = () => {
  const load = useMealsStore((s) => s.load)
  const loadTemplates = useMealsStore((s) => s.loadTemplates)
  const loadFailed = useMealsStore((s) => s.loadFailed)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    load().catch(() => undefined)
    loadTemplates().catch(() => undefined)
  }, [load, loadTemplates])

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
        <Tab label="Меню" />
        <Tab label="Шаблони" />
        <Tab label="Довідники" />
      </Tabs>
      {tab === 0 && <MenuTab />}
      {tab === 1 && <TemplatesTab />}
      {tab === 2 && <DirectoriesTab />}
    </Box>
  )
}
