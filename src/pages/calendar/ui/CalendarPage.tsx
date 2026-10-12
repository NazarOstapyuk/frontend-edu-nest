import { useEffect, useState } from 'react'
import { Box, Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { useCalendarStore } from '../model/calendarStore'
import { CalendarDayModal } from './CalendarDayModal'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { calendarDayTypeLabels, calendarScopeLabels, formatDay, type CalendarEntry } from '../../../shared/api'

const period = (e: CalendarEntry) =>
  e.startDate === e.endDate ? formatDay(e.startDate) : `${formatDay(e.startDate)} – ${formatDay(e.endDate)}`

export const CalendarPage = () => {
  const year = useCalendarStore((s) => s.year)
  const entries = useCalendarStore((s) => s.entries)
  const editDays = useCalendarStore((s) => s.editDays)
  const isSaving = useCalendarStore((s) => s.isSaving)
  const setYear = useCalendarStore((s) => s.setYear)
  const loadMeta = useCalendarStore((s) => s.loadMeta)
  const setModalOpen = useCalendarStore((s) => s.setModalOpen)
  const voidEntry = useCalendarStore((s) => s.voidEntry)
  const saveEditDays = useCalendarStore((s) => s.saveEditDays)
  const [voiding, setVoiding] = useState<CalendarEntry | null>(null)
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    setYear(useCalendarStore.getState().year).catch(() => undefined)
    loadMeta().catch(() => undefined)
  }, [setYear, loadMeta])

  const daysInput = draft ?? (editDays === null ? '' : String(editDays))
  const daysValue = Number(daysInput)
  const daysValid = daysInput !== '' && Number.isInteger(daysValue) && daysValue >= 0 && daysValue <= 30

  return (
    <Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography sx={{ mr: 'auto' }}>Скільки днів назад вчитель може виправляти журнал</Typography>
        <TextField
          size="small"
          type="number"
          value={daysInput}
          onChange={(e) => setDraft(e.target.value)}
          error={daysInput !== '' && !daysValid}
          helperText={daysInput !== '' && !daysValid ? 'Від 0 до 30' : undefined}
          sx={{ width: 120 }}
        />
        <Button variant="outlined" disabled={!daysValid || isSaving || daysValue === editDays} onClick={() => saveEditDays(daysValue).then(() => setDraft(null)).catch(() => undefined)}>
          Зберегти
        </Button>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => setYear(year - 1).catch(() => undefined)}><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{year}</Typography>
        <IconButton onClick={() => setYear(year + 1).catch(() => undefined)}><ChevronRightIcon /></IconButton>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ ml: 'auto' }} onClick={() => setModalOpen(true)}>
          Додати
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Період</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Для кого</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                  Записів немає. Будні дні робочі, вихідні неробочі.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{period(e)}</TableCell>
                  <TableCell>{calendarDayTypeLabels[e.type]}</TableCell>
                  <TableCell>{e.scope === 'group' ? e.group?.name : calendarScopeLabels[e.scope]}</TableCell>
                  <TableCell>{e.title}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => setVoiding(e)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <CalendarDayModal />
      <ReasonDialog
        open={voiding !== null}
        title="Скасувати запис календаря"
        subtitle={voiding ? `${voiding.title}, ${period(voiding)}` : undefined}
        confirmLabel="Скасувати запис"
        isSaving={isSaving}
        onClose={() => setVoiding(null)}
        onSubmit={async (reason) => {
          if (voiding) await voidEntry(voiding.id, reason)
          setVoiding(null)
        }}
      />
    </Box>
  )
}
