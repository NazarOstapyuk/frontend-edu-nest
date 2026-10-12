import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { attendanceStatusLabels, formatDay, type Visit } from '../../../shared/api'

const describe = (v: Visit) => {
  if (v.type === 'lesson') return [`${v.directionName}, ${v.groupName}`, `${attendanceStatusLabels[v.status]}${v.isGuest ? ' (разово)' : ''}`]
  if (v.type === 'adaptation') return ['Адаптація', `${v.hours} год`]
  return [`${v.directionName} (старий абонемент)`, v.note ?? 'Відвідування']
}

export const VisitsTab = ({ visits }: { visits: Visit[] }) => {
  if (visits.length === 0) return <Typography color="text.secondary">Відвідувань ще немає.</Typography>
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
