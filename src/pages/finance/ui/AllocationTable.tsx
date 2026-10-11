import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { financeCategoryLabels, formatMoney, type SuggestionLine } from '../../../shared/api'

interface AllocationTableProps {
  lines: SuggestionLine[]
  renderAmountField: (index: number) => ReactNode
}

export const AllocationTable = ({ lines, renderAmountField }: AllocationTableProps) => {
  if (lines.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Відкритих нарахувань немає.
      </Typography>
    )
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Нарахування</TableCell>
          <TableCell>Категорія</TableCell>
          <TableCell align="right">Залишок</TableCell>
          <TableCell sx={{ width: 160 }}>Сума</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line, index) => (
          <TableRow key={line.chargeId}>
            <TableCell>
              {line.description}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {new Date(line.periodStart ?? line.createdAt).toLocaleDateString('uk-UA')}
              </Typography>
            </TableCell>
            <TableCell>{financeCategoryLabels[line.category]}</TableCell>
            <TableCell align="right">{formatMoney(line.remaining)}</TableCell>
            <TableCell>{renderAmountField(index)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
