import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { attendanceStatusLabels, formatDay, type Visit } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'

const describe = (v: Visit) => {
  if (v.type === 'lesson') return [`${v.directionName}, ${v.groupName}`, `${attendanceStatusLabels[v.status]}${v.isGuest ? ' (разово)' : ''}`]
  if (v.type === 'adaptation') return ['Адаптація', `${v.hours} год`]
  return [`${v.directionName} (старий абонемент)`, v.note ?? 'Відвідування']
}

export const VisitsTab = ({ visits }: { visits: Visit[] }) => {
  const isPhone = useIsPhone()
  if (visits.length === 0) return <Typography color="text.secondary">Немає записів за цей місяць.</Typography>
  if (isPhone) {
    return (
      <CardList
        items={visits.map((v, i) => ({ v, i }))}
        getKey={({ v, i }) => `${v.type}-${v.date}-${i}`}
        renderCard={({ v }) => {
          const [what, status] = describe(v)
          return (
            <>
              <Typography sx={{ fontWeight: 600 }}>{formatDay(v.date)}</Typography>
              <CardField label="Що">{what}</CardField>
              <CardField label="Статус">{status}</CardField>
            </>
          )
        }}
      />
    )
  }
  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Дата</TableCell>
            <TableCell>Що</TableCell>
            <TableCell>Статус</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visits.map((v, i) => {
            const [what, status] = describe(v)
            return (
              <TableRow key={`${v.type}-${v.date}-${i}`}>
                <TableCell>{formatDay(v.date)}</TableCell>
                <TableCell>{what}</TableCell>
                <TableCell>{status}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Paper>
  )
}
