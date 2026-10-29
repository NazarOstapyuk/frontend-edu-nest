import { useState } from 'react'
import { Box, Card, CardContent, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { formatCell, type ColumnType, type Report, type ReportColumn, type ReportRow } from '../../../shared/api'

const alignOf = (type: ColumnType) =>
  type === 'text' || type === 'date' ? 'left' : 'right'

interface DataTableProps {
  columns: ReportColumn[]
  rows: ReportRow[]
  totals: ReportRow | null
}

const TableView = ({ columns, rows, totals }: DataTableProps) => (
  <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: 'grey.50' }}>
          {columns.map((c) => (
            <TableCell key={c.key} align={alignOf(c.type)} sx={{ fontWeight: 600 }}>
              {c.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={Math.max(columns.length, 1)} align="center" sx={{ py: 4, color: 'text.secondary' }}>
              Немає даних за період
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index} hover>
              {columns.map((c) => (
                <TableCell key={c.key} align={alignOf(c.type)}>
                  {formatCell(c.type, row[c.key] ?? null)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
        {totals && rows.length > 0 && (
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            {columns.map((c) => (
              <TableCell key={c.key} align={alignOf(c.type)} sx={{ fontWeight: 700 }}>
                {formatCell(c.type, totals[c.key] ?? null)}
              </TableCell>
            ))}
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
)

const CardsView = ({ columns, rows, totals }: DataTableProps) => (
  <Stack spacing={1.5}>
    <CardList
      items={rows.map((row, index) => ({ row, index }))}
      getKey={(item) => String(item.index)}
      empty={<Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>Немає даних за період</Typography>}
      renderCard={({ row }) => (
        <Box>
          {columns.map((c) => (
            <CardField key={c.key} label={c.label}>
              {formatCell(c.type, row[c.key] ?? null)}
            </CardField>
          ))}
        </Box>
      )}
    />
    {totals && rows.length > 0 && (
      <Card variant="outlined">
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {columns.map((c) => (
            <CardField key={c.key} label={c.label}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                {formatCell(c.type, totals[c.key] ?? null)}
              </Box>
            </CardField>
          ))}
        </CardContent>
      </Card>
    )}
  </Stack>
)

const DataTable = (props: DataTableProps) => {
  const isPhone = useIsPhone()
  return isPhone ? <CardsView {...props} /> : <TableView {...props} />
}

export const ReportTable = ({ report }: { report: Report }) => {
  const [sheet, setSheet] = useState(0)
  const index = Math.min(sheet, Math.max(report.sheets.length - 1, 0))
  const active = report.sheets[index]

  return (
    <Stack spacing={2}>
      <Typography variant="h6">{report.title}</Typography>
      <DataTable columns={report.columns} rows={report.rows} totals={report.totals} />
      {active && (
        <Stack spacing={1}>
          <Tabs value={index} onChange={(_, value: number) => setSheet(value)} variant="scrollable" allowScrollButtonsMobile>
            {report.sheets.map((s) => (
              <Tab key={s.name} label={s.name} />
            ))}
          </Tabs>
          <DataTable columns={active.columns} rows={active.rows} totals={active.totals} />
        </Stack>
      )}
    </Stack>
  )
}
