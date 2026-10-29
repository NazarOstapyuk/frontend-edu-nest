import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { FieldChange } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

export const ChangesTable = ({ changes }: { changes: FieldChange[] }) => {
  const isPhone = useIsPhone()
  if (changes.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        Без змін полів
      </Typography>
    )
  if (isPhone)
    return (
      <Box>
        {changes.map((change) => (
          <Box key={change.field} sx={{ py: 1, borderBottom: 1, borderColor: 'divider', overflowWrap: 'anywhere' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {change.field}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Було: {change.before ?? '—'}
            </Typography>
            <Typography variant="body2">Стало: {change.after ?? '—'}</Typography>
          </Box>
        ))}
      </Box>
    )
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Поле</TableCell>
          <TableCell>Було</TableCell>
          <TableCell>Стало</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {changes.map((change) => (
          <TableRow key={change.field}>
            <TableCell>{change.field}</TableCell>
            <TableCell sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>{change.before ?? '—'}</TableCell>
            <TableCell sx={{ wordBreak: 'break-word' }}>{change.after ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
