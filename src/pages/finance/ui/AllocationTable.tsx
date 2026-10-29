import type { ReactNode } from 'react'
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { financeCategoryLabels, formatMoney, type SuggestionLine } from '../../../shared/api'

interface AllocationTableProps {
  lines: SuggestionLine[]
  renderAmountField: (index: number) => ReactNode
}

export const AllocationTable = ({ lines, renderAmountField }: AllocationTableProps) => {
  const isPhone = useIsPhone()

  if (lines.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Відкритих нарахувань немає.
      </Typography>
    )
  }

  if (isPhone) {
    return (
      <CardList
        items={lines.map((line, index) => ({ line, index }))}
        getKey={({ line }) => line.chargeId}
        renderCard={({ line, index }) => (
          <>
            <Typography sx={{ fontWeight: 600 }}>{line.description}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {new Date(line.periodStart ?? line.createdAt).toLocaleDateString('uk-UA')}
            </Typography>
            <CardField label="Категорія">{financeCategoryLabels[line.category]}</CardField>
            <CardField label="Залишок">{formatMoney(line.remaining)}</CardField>
            <Box sx={{ mt: 1 }}>{renderAmountField(index)}</Box>
          </>
        )}
      />
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
