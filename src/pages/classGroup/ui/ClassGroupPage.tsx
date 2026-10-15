import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
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
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import { useClassGroupStore } from '../model/classGroupStore'
import { useAuthStore, useCan, type SessionRole } from '../../../entities/user'
import { attendanceStatusLabels, classFormatLabels, formatDay, localToday, missedRuleLabels } from '../../../shared/api'
import { AddMemberModal } from './AddMemberModal'

export const ClassGroupPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.profile?.role) as SessionRole | undefined
  const isAdmin = role === 'root' || role === 'admin'
  const canManage = useCan('classes', 'edit')
  const group = useClassGroupStore((s) => s.group)
  const storeGroupId = useClassGroupStore((s) => s.groupId)
  const fetchGroup = useClassGroupStore((s) => s.fetchGroup)
  const setAddMemberOpen = useClassGroupStore((s) => s.setAddMemberOpen)
  const endMember = useClassGroupStore((s) => s.endMember)
  const isSaving = useClassGroupStore((s) => s.isSaving)
  const [lessonDate, setLessonDate] = useState(localToday())

  useEffect(() => {
    if (groupId) fetchGroup(groupId, isAdmin).catch(() => undefined)
  }, [groupId, isAdmin, fetchGroup])

  if (!group || storeGroupId !== groupId) {
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(isAdmin ? '/classes' : '/my-classes')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{group.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {group.direction.name} · {classFormatLabels[group.format]} · {missedRuleLabels[group.direction.missedRule]}
          </Typography>
        </Box>
        <TextField
          size="small"
          type="date"
          label="Дата заняття"
          value={lessonDate}
          onChange={(e) => setLessonDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: localToday() } }}
        />
        <Button
          variant="contained"
          startIcon={<EventAvailableIcon />}
          disabled={!lessonDate}
          onClick={() => navigate(`/classes/${group.id}/lessons/${lessonDate}`)}
        >
          Відмітити заняття
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          <Typography sx={{ fontWeight: 700, mr: 'auto' }}>Склад ({group.activeMembers})</Typography>
          {isAdmin && canManage && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setAddMemberOpen(true)}>
              Додати дитину
            </Button>
          )}
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Дитина</TableCell>
              <TableCell>З</TableCell>
              <TableCell>По</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {group.members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>Дітей ще немає.</TableCell>
              </TableRow>
            ) : (
              group.members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.child.lastName} {m.child.firstName}</TableCell>
                  <TableCell>{formatDay(m.startDate)}</TableCell>
                  <TableCell>{m.endDate ? formatDay(m.endDate) : '—'}</TableCell>
                  <TableCell align="right">
                    {isAdmin && canManage && !m.endDate && (
                      <Button
                        size="small"
                        color="error"
                        disabled={isSaving}
                        onClick={() => endMember(m.id, localToday()).catch(() => undefined)}
                      >
                        Вивести сьогодні
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 700, p: 2 }}>Заняття</Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Дата</TableCell>
              <TableCell>Провів</TableCell>
              <TableCell>Відмітки</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {group.lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>Занять ще не було.</TableCell>
              </TableRow>
            ) : (
              group.lessons.map((l) => (
                <TableRow
                  key={l.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/classes/${group.id}/lessons/${l.date.slice(0, 10)}`)}
                >
                  <TableCell>{formatDay(l.date)}</TableCell>
                  <TableCell>{l.conductedBy.lastName} {l.conductedBy.firstName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {l.attendances.map((a) => (
                        <Chip
                          key={a.childId}
                          size="small"
                          variant="outlined"
                          color={a.status === 'present' ? 'success' : 'default'}
                          label={`${a.childName}: ${attendanceStatusLabels[a.status]}${a.isGuest ? ' (разово)' : ''}`}
                        />
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {isAdmin && canManage && <AddMemberModal />}
    </Box>
  )
}
