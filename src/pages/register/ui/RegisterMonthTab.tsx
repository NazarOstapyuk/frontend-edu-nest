import { useMemo } from 'react'
import { Alert, Box, Button, ButtonBase, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { useRegisterStore } from '../model/registerStore'
import { cellView, legend } from './monthCodes'
import { dayStateLabels, formatDay, localToday } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList } from '../../../shared/ui/CardList'

export const RegisterMonthTab = ({ onOpenDay }: { onOpenDay: (date: string) => void }) => {
  const monthData = useRegisterStore((s) => s.monthData)
  const reasons = useRegisterStore((s) => s.allReasons)
  const monthError = useRegisterStore((s) => s.monthError)
  const loadMonth = useRegisterStore((s) => s.loadMonth)
  const today = localToday()
  const isPhone = useIsPhone()
  const reasonMap = useMemo(() => new Map(reasons.map((r) => [r.id, r])), [reasons])

  if (monthError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadMonth().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  if (!monthData) return <Typography color="text.secondary">Завантаження…</Typography>

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{legend}</Typography>
      {isPhone ? (
      <Box sx={{ mb: 2 }}>
        {monthData.days.some((d) => d.title) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {monthData.days
              .filter((d) => d.title)
              .map((d) => `${Number(d.date.slice(8))}: ${d.title}`)
              .join(' · ')}
          </Typography>
        )}
        <CardList
          items={monthData.children}
          getKey={(r) => r.child.id}
          empty={<Typography color="text.secondary">У групі немає дітей.</Typography>}
          renderCard={(row) => {
            const reasonLines = row.days
              .filter((cell) => cell.reasonId && reasonMap.get(cell.reasonId))
              .map((cell) => `${Number(cell.date.slice(8))}: ${reasonMap.get(cell.reasonId as string)?.name}`)
            return (
              <>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>{row.child.lastName} {row.child.firstName}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  <Chip size="small" color="success" variant="outlined" label={`Присут.: ${row.summary.present}`} />
                  <Chip size="small" color="warning" variant="outlined" label={`Пов.: ${row.summary.absentExcused}`} />
                  <Chip size="small" color="error" variant="outlined" label={`Без пр.: ${row.summary.absentUnexcused}`} />
                  <Chip size="small" variant="outlined" label={`Не відм.: ${row.summary.unmarked}`} />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {row.days.map((cell) => {
                    const view = cellView(cell, reasonMap, today)
                    const reason = cell.reasonId ? reasonMap.get(cell.reasonId)?.name : undefined
                    return (
                      <ButtonBase
                        key={cell.date}
                        onClick={() => onOpenDay(cell.date)}
                        aria-label={`${formatDay(cell.date)}: ${dayStateLabels[cell.state]}${reason ? `, ${reason}` : ''}`}
                        sx={{
                          width: 40,
                          height: 40,
                          flexDirection: 'column',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          color: view.color,
                          bgcolor: view.bg,
                          lineHeight: 1.1,
                        }}
                      >
                        <Typography component="span" sx={{ fontSize: 10, color: 'text.secondary' }}>{Number(cell.date.slice(8))}</Typography>
                        <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, minHeight: 16 }}>{view.code}</Typography>
                      </ButtonBase>
                    )
                  })}
                </Box>
                {reasonLines.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Причини: {reasonLines.join(' · ')}
                  </Typography>
                )}
              </>
            )
          }}
        />
      </Box>
      ) : (
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
                    const view = cellView(cell, reasonMap, today)
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
      )}
    </Box>
  )
}
