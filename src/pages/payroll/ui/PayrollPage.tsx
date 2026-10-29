import { useEffect, useState } from 'react'
import { Alert, Box, Button, Tab, Tabs } from '@mui/material'
import { usePayrollStore } from '../model/payrollStore'
import { SheetTab } from './SheetTab'
import { TermsTab } from './TermsTab'

export const PayrollPage = () => {
  const loadRefs = usePayrollStore((s) => s.loadRefs)
  const refsFailed = usePayrollStore((s) => s.refsFailed)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    loadRefs().catch(() => undefined)
  }, [loadRefs])

  return (
    <Box>
      {refsFailed && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button onClick={() => loadRefs().catch(() => undefined)}>Спробувати ще</Button>}
        >
          Не вдалося завантажити дані.
        </Alert>
      )}
      <Tabs
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label="Відомість" />
        <Tab label="Умови" />
      </Tabs>
      {tab === 0 && <SheetTab />}
      {tab === 1 && <TermsTab />}
    </Box>
  )
}
