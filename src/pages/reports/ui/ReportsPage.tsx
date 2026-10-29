import { useEffect } from 'react'
import { Button, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material'
import { canAccess, useAuthStore } from '../../../entities/user'
import { reportDefinitions, type ReportKey } from '../../../shared/api'
import { useReportsStore } from '../model/reportsStore'
import { ReportFilters } from './ReportFilters'
import { ReportTable } from './ReportTable'

export const ReportsPage = () => {
  const profile = useAuthStore((s) => s.profile)
  const selected = useReportsStore((s) => s.selected)
  const report = useReportsStore((s) => s.report)
  const loading = useReportsStore((s) => s.loading)
  const failed = useReportsStore((s) => s.failed)
  const select = useReportsStore((s) => s.select)
  const load = useReportsStore((s) => s.load)

  const visible = reportDefinitions.filter((d) =>
    d.areas.some((a) => canAccess(profile, a, 'view')),
  )
  const definition = visible.find((d) => d.key === selected)
  const firstKey = visible[0]?.key

  useEffect(() => {
    if (!definition && firstKey) select(firstKey)
  }, [definition, firstKey, select])

  if (visible.length === 0) {
    return <Typography color="text.secondary">Немає доступних звітів</Typography>
  }

  return (
    <Stack spacing={2}>
      <Tabs
        value={definition ? definition.key : false}
        onChange={(_, key: ReportKey) => select(key)}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {visible.map((d) => (
          <Tab key={d.key} value={d.key} label={d.label} />
        ))}
      </Tabs>
      {definition && <ReportFilters definition={definition} />}
      {loading && <LinearProgress />}
      {failed && (
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography color="error">Не вдалося завантажити дані.</Typography>
          <Button size="small" onClick={() => load()}>
            Спробувати ще
          </Button>
        </Stack>
      )}
      {report && <ReportTable report={report} />}
    </Stack>
  )
}
