import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useMarkLessonStore } from '../model/markLessonStore'
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList } from '../../../shared/ui/CardList'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import {
  attendanceStatusLabels,
  attendanceStatuses,
  formatDay,
  localToday,
  type AttendanceStatus,
  type Child,
} from '../../../shared/api'

export const MarkLessonPage = () => {
  const { groupId, date } = useParams<{ groupId: string; date: string }>()
  const navigate = useNavigate()
  const isAdmin = useCan('classes', 'edit')
  const roster = useMarkLessonStore((s) => s.roster)
  const storeKey = useMarkLessonStore((s) => s.key)
  const draft = useMarkLessonStore((s) => s.draft)
  const guests = useMarkLessonStore((s) => s.guests)
  const allChildren = useMarkLessonStore((s) => s.allChildren)
  const isSaving = useMarkLessonStore((s) => s.isSaving)
  const load = useMarkLessonStore((s) => s.load)
  const setStatus = useMarkLessonStore((s) => s.setStatus)
  const markPresent = useMarkLessonStore((s) => s.markPresent)
  const addGuest = useMarkLessonStore((s) => s.addGuest)
  const save = useMarkLessonStore((s) => s.save)
  const isPhone = useIsPhone()
  const [reasonOpen, setReasonOpen] = useState(false)
  const [guest, setGuest] = useState<Child | null>(null)
  const [unmarkedOpen, setUnmarkedOpen] = useState(false)

  useEffect(() => {
    if (groupId && date) load(groupId, date, true).catch(() => undefined)
  }, [groupId, date, load])

  if (!roster || storeKey !== `${groupId}/${date}`) {
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  const isLate = (date ?? '') < localToday()
  const hasCorrections = roster.rows.some((r) => r.attendance && draft[r.child.id] && draft[r.child.id] !== r.attendance.status)
  const rows = [
    ...roster.rows,
    ...guests.map((g) => ({
      child: { id: g.id, firstName: g.firstName, lastName: g.lastName },
      isMember: false,
      attendance: null,
      packageInfo: null,
    })),
  ]

  const isBlocked = (row: (typeof rows)[number]) =>
    row.isMember && !row.packageInfo && !roster.hasSingleTariff && !row.attendance
  const missedRule = roster.group.direction.missedRule
  const statusDisabled = (row: (typeof rows)[number], status: AttendanceStatus) => {
    if (!isBlocked(row)) return false
    if (status === 'present') return true
    if (missedRule === 'always') return true
    return missedRule === 'unexcused_only' && status === 'absent_unexcused'
  }
  const guestWarning = (row: (typeof rows)[number]) =>
    !row.isMember && !roster.hasSingleTariff ? 'Якщо в гостя немає пакета, збереження не пройде' : null
  const blockedCount = rows.filter(isBlocked).length
  const unmarkedCount = rows.filter((r) => !draft[r.child.id] && !isBlocked(r)).length
  const availableGuests = allChildren.filter(
    (c) => !roster.rows.some((r) => r.child.id === c.id) && !guests.some((g) => g.id === c.id),
  )

  const packageChip = (row: (typeof rows)[number]) =>
    row.packageInfo ? (
      <Chip
        size="small"
        color="success"
        variant="outlined"
        label={`Пакет: ${row.packageInfo.remaining} з ${row.packageInfo.total}${
          row.packageInfo.expiresAt ? `, до ${formatDay(row.packageInfo.expiresAt)}` : ''
        }`}
      />
    ) : row.isMember ? (
      <Chip size="small" color="warning" variant="outlined" label="Без пакета — разове заняття" />
    ) : null

  const handleSave = (confirmed = false) => {
    if (!confirmed && unmarkedCount > 0) {
      setUnmarkedOpen(true)
      return
    }
    if (isAdmin && isLate && hasCorrections) {
      setReasonOpen(true)
      return
    }
    save().catch(() => undefined)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(`/classes/${roster.group.id}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{roster.group.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDay(roster.date)}
            {roster.conductedBy ? ` · провів ${roster.conductedBy.lastName} ${roster.conductedBy.firstName}` : ''}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          disabled={isSaving || unmarkedCount === 0}
          onClick={() => markPresent(rows.filter((r) => !isBlocked(r)).map((r) => r.child.id))}
          sx={{ minHeight: { xs: 40, sm: 'unset' } }}
        >
          Усі присутні
        </Button>
        <Button variant="contained" disabled={isSaving} onClick={() => handleSave()} sx={{ minHeight: { xs: 40, sm: 'unset' } }}>
          Зберегти
        </Button>
      </Box>

      {blockedCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Для цієї групи не задано тариф разового заняття, тому дітей без пакета не можна відмітити присутніми (а пропуск, що списує заняття, залежить від правила напрямку). Задайте тариф у налаштуваннях групи або продайте пакет.
        </Alert>
      )}

      {isPhone ? (
        <Box sx={{ mb: 2 }}>
          <CardList
            items={rows}
            getKey={(r) => r.child.id}
            empty={<Typography color="text.secondary">У групі немає дітей на цю дату.</Typography>}
            renderCard={(row) => (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{row.child.lastName} {row.child.firstName}</Typography>
                  {!row.isMember && <Chip size="small" label="Разово" />}
                </Box>
                {guestWarning(row) && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
                    {guestWarning(row)}
                  </Typography>
                )}
                {packageChip(row) && <Box sx={{ mb: 1 }}>{packageChip(row)}</Box>}
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  orientation="vertical"
                  value={draft[row.child.id] ?? null}
                  onChange={(_, value: AttendanceStatus | null) => {
                    if (value) setStatus(row.child.id, value)
                  }}
                >
                  {attendanceStatuses.map((s) => (
                    <ToggleButton key={s} value={s} disabled={statusDisabled(row, s)} sx={{ minHeight: 44 }}>
                      {attendanceStatusLabels[s]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </>
            )}
          />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Дитина</TableCell>
              <TableCell>Пакет</TableCell>
              <TableCell>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>У групі немає дітей на цю дату.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.child.id}>
                  <TableCell>
                    {row.child.lastName} {row.child.firstName}
                    {!row.isMember && <Chip size="small" label="Разово" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>
                    {packageChip(row)}
                    {guestWarning(row) && (
                      <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                        {guestWarning(row)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={draft[row.child.id] ?? null}
                      onChange={(_, value: AttendanceStatus | null) => {
                        if (value) setStatus(row.child.id, value)
                      }}
                    >
                      {attendanceStatuses.map((s) => (
                        <ToggleButton key={s} value={s} disabled={statusDisabled(row, s)}>
                          {attendanceStatusLabels[s]}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Autocomplete
          sx={{ minWidth: { xs: 0, sm: 320 }, width: { xs: '100%', sm: 'auto' } }}
          options={availableGuests}
          getOptionLabel={(c) => `${c.lastName} ${c.firstName}`}
          value={guest}
          onChange={(_, selected) => setGuest(selected)}
          renderInput={(params) => <TextField {...params} size="small" label="Разовий учасник" />}
        />
        <Button
          disabled={!guest}
          onClick={() => {
            if (guest) addGuest(guest)
            setGuest(null)
          }}
        >
          Додати
        </Button>
      </Box>

      <ConfirmDialog
        open={unmarkedOpen}
        title="Є діти без відмітки"
        text={`Без відмітки: ${unmarkedCount}. Для них не буде створено запис відвідування і не спишеться заняття.`}
        confirmLabel="Зберегти так"
        cancelLabel="Повернутися"
        color="primary"
        onConfirm={() => handleSave(true)}
        onClose={() => setUnmarkedOpen(false)}
      />

      <ReasonDialog
        open={reasonOpen}
        title="Виправлення відмітки"
        subtitle="Заняття вже минуло. Вкажіть причину виправлення."
        confirmLabel="Зберегти"
        isSaving={isSaving}
        onClose={() => setReasonOpen(false)}
        onSubmit={(reason) => save(reason)}
      />
    </Box>
  )
}
