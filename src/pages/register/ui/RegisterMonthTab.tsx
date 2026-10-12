import { useMemo } from 'react'
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { useRegisterStore } from '../model/registerStore'
import { cellView, legend } from './monthCodes'
import { dayStateLabels } from '../../../shared/api'

export const RegisterMonthTab = ({ onOpenDay }: { onOpenDay: (date: string) => void }) => {
  const monthData = useRegisterStore((s) => s.monthData)
  const reasons = useRegisterStore((s) => s.reasons)
  const reasonMap = useMemo(() => new Map(reasons.map((r) => [r.id, r])), [reasons])

  if (!monthData) return <Typography color="text.secondary">Завантаження…</Typography>

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{legend}</Typography>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table size="small" sx={{ '& td, & th': { px: 0.5, textAlign: 'center' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'grey.50', textAlign: 'left !important', minWidth: 160 }}>Дитина</TableCell>
              {monthData.days.map((d) => (
                <TableCell key={d.date} sx={{ color: d.working ? 'text.primary' : 'text.disabled', minWidth: 30 }}>
                  <Tooltip title={d.title ?? ''}><span>{Number(d.date.slice(8))}</span></Tooltip>
                </TableCell>
              ))}
              <TableCell>Присут.</TableCell>
              <TableCell>Пов.</TableCell>
              <TableCell>Без пр.</TableCell>
              <TableCell>Не відм.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {monthData.children.length === 0 ? (
              <TableRow>
                <TableCell colSpan={monthData.days.length + 5} sx={{ color: 'text.secondary' }}>У групі немає дітей.</TableCell>
              </TableRow>
            ) : (
              monthData.children.map((row) => (
                <TableRow key={row.child.id}>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', textAlign: 'left !important', whiteSpace: 'nowrap' }}>
                    {row.child.lastName} {row.child.firstName}
                  </TableCell>
                  {row.days.map((cell) => {
                    const view = cellView(cell, reasonMap)
                    const reason = cell.reasonId ? reasonMap.get(cell.reasonId)?.name : undefined
                    return (
                      <TableCell
                        key={cell.date}
                        onClick={() => onOpenDay(cell.date)}
                        sx={{ cursor: 'pointer', color: view.color, bgcolor: view.bg, fontWeight: 600 }}
                      >
                        <Tooltip title={`${dayStateLabels[cell.state]}${reason ? `: ${reason}` : ''}`}>
                          <span>{view.code}</span>
                        </Tooltip>
                      </TableCell>
                    )
                  })}
                  <TableCell>{row.summary.present}</TableCell>
                  <TableCell>{row.summary.absentExcused}</TableCell>
                  <TableCell>{row.summary.absentUnexcused}</TableCell>
                  <TableCell>{row.summary.unmarked}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
