import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { cashApi, toKopecks, type CashDeskState, type CashShiftView, type Person } from '../../../shared/api'
import { useCan } from '../../../entities/user'
import { brandColors } from '../../../shared/assets/brand'
import { formatDateTime } from '../../../shared/lib/date'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'
import { DateField } from '../../../shared/ui/DateField'
import { formatKopecks, signedKopecks } from '../model/cashFormat'

const monthRange = () => {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })
  const [year, month] = today.split('-').map(Number)
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const mm = String(month).padStart(2, '0')
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}` }
}

const differenceColor = (kopecks: number) =>
  kopecks === 0 ? 'text.secondary' : kopecks < 0 ? brandColors.debt : brandColors.partialText

const Difference = ({ shift }: { shift: CashShiftView }) => {
  if (shift.difference == null) return <>—</>
  const kopecks = toKopecks(shift.difference)
  return (
    <Typography component="span" sx={{ fontWeight: 800, whiteSpace: 'nowrap', color: differenceColor(kopecks) }}>
      {signedKopecks(kopecks)}
    </Typography>
  )
}

const money = (value: string | null) => (value == null ? '—' : formatKopecks(toKopecks(value)))

export const ShiftsTab = () => {
  const isPhone = useIsPhone()
  const canControl = useCan('cash_control', 'view')
  const [, setSearchParams] = useSearchParams()
  const [range, setRange] = useState(monthRange)
  const [deskId, setDeskId] = useState('')
  const [userId, setUserId] = useState('')
  const [desks, setDesks] = useState<CashDeskState[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; shifts: CashShiftView[] | null } | null>(null)

  useEffect(() => {
    cashApi
      .getDesks(canControl)
      .then(setDesks)
      .catch(() => undefined)
    if (canControl) {
      cashApi
        .getRecipients(true)
        .then(setPeople)
        .catch(() => undefined)
    }
  }, [canControl])

  const requestKey = JSON.stringify([deskId, range, userId, attempt])

  useEffect(() => {
    let active = true
    cashApi
      .getShifts({
        deskId: deskId || undefined,
        from: range.from || undefined,
        to: range.to || undefined,
        userId: userId || undefined,
      })
      .then((shifts) => active && setResult({ key: requestKey, shifts }))
      .catch(() => active && setResult({ key: requestKey, shifts: null }))
    return () => {
      active = false
    }
  }, [deskId, range, userId, requestKey])

  const current = result && result.key === requestKey ? result : null
  const isLoading = !current
  const failed = !!current && !current.shifts
  const retry = () => setAttempt((value) => value + 1)

  const openReport = (shift: CashShiftView) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('shift', shift.id)
        return next
      },
      { replace: true },
    )

  const sorted = useMemo(
    () => [...(current?.shifts ?? [])].sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
    [current],
  )
  const empty = 'За обраний період змін немає'

  const closedCell = (shift: CashShiftView) =>
    shift.closedAt ? (
      formatDateTime(shift.closedAt)
    ) : (
      <Chip size="small" label="Відкрита" sx={{ bgcolor: brandColors.partialBg, color: brandColors.partialText }} />
    )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          select
          label="Каса"
          value={deskId}
          onChange={(event) => setDeskId(event.target.value)}
          sx={{ minWidth: { sm: 200 } }}
        >
          <MenuItem value="">Усі каси</MenuItem>
          {desks.map((desk) => (
            <MenuItem key={desk.id} value={desk.id}>
              {desk.name}
            </MenuItem>
          ))}
        </TextField>
        <DateField label="Від" value={range.from} onChange={(from) => setRange((prev) => ({ ...prev, from }))} max={range.to || undefined} />
        <DateField label="До" value={range.to} onChange={(to) => setRange((prev) => ({ ...prev, to }))} min={range.from || undefined} />
        {canControl && (
          <TextField
            select
            label="Працівник"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            sx={{ minWidth: { sm: 220 } }}
          >
            <MenuItem value="">Усі працівники</MenuItem>
            {people.map((person) => (
              <MenuItem key={person.id} value={person.id}>
                {person.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {failed ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={retry}>
              Спробувати ще
            </Button>
          }
        >
          Не вдалося завантажити зміни.
        </Alert>
      ) : isLoading ? (
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: '20px' }} />
      ) : isPhone ? (
        <CardList
          items={sorted}
          getKey={(shift) => shift.id}
          empty={<Typography color="text.secondary">{empty}</Typography>}
          renderCard={(shift) => (
            <Box onClick={() => openReport(shift)} sx={{ cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>{shift.deskName}</Typography>
                <Difference shift={shift} />
              </Box>
              <CardField label="Відкрито">{formatDateTime(shift.openedAt)}</CardField>
              <CardField label="Закрито">{closedCell(shift)}</CardField>
              <CardField label="Відкрив">{shift.openedBy.name}</CardField>
              {shift.closedBy && <CardField label="Закрив">{shift.closedBy.name}</CardField>}
              <CardField label="На початок">{money(shift.openingCounted)}</CardField>
              <CardField label="Має бути">{money(shift.closingExpected ?? shift.expected)}</CardField>
              <CardField label="Фактично">{money(shift.closingCounted)}</CardField>
            </Box>
          )}
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' } }}>
                <TableCell>Каса</TableCell>
                <TableCell>Відкрито</TableCell>
                <TableCell>Закрито</TableCell>
                <TableCell>Відкрив</TableCell>
                <TableCell>Закрив</TableCell>
                <TableCell align="right">На початок</TableCell>
                <TableCell align="right">Має бути</TableCell>
                <TableCell align="right">Фактично</TableCell>
                <TableCell align="right">Різниця</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ color: 'text.secondary' }}>
                    {empty}
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((shift) => (
                  <TableRow key={shift.id} hover onClick={() => openReport(shift)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 700 }}>{shift.deskName}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(shift.openedAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{closedCell(shift)}</TableCell>
                    <TableCell>{shift.openedBy.name}</TableCell>
                    <TableCell>{shift.closedBy?.name ?? '—'}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{money(shift.openingCounted)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{money(shift.closingExpected ?? shift.expected)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{money(shift.closingCounted)}</TableCell>
                    <TableCell align="right">
                      <Difference shift={shift} />
                    </TableCell>
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
