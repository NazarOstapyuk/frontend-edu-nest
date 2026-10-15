import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { FieldChange } from '../../../shared/api'

export const ChangesTable = ({ changes }: { changes: FieldChange[] }) => {
  if (changes.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        Без змін полів
      </Typography>
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
