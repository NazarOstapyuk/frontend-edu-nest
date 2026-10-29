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
import { canAccess, useAuthStore, useCan } from '../../../entities/user'
import { attendanceStatusLabels, classFormatLabels, formatDay, localToday, missedRuleLabels } from '../../../shared/api'
import { AddMemberModal } from './AddMemberModal'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'

export const ClassGroupPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const canManage = useCan('classes', 'edit')
  const canViewClasses = useAuthStore((s) => canAccess(s.profile, 'classes', 'view'))
  const group = useClassGroupStore((s) => s.group)
  const storeGroupId = useClassGroupStore((s) => s.groupId)
  const fetchGroup = useClassGroupStore((s) => s.fetchGroup)
  const setAddMemberOpen = useClassGroupStore((s) => s.setAddMemberOpen)
  const endMember = useClassGroupStore((s) => s.endMember)
  const isSaving = useClassGroupStore((s) => s.isSaving)
  const isPhone = useIsPhone()
  const [lessonDate, setLessonDate] = useState(localToday())

  useEffect(() => {
    if (groupId) fetchGroup(groupId, canManage).catch(() => undefined)
  }, [groupId, canManage, fetchGroup])

  if (!group || storeGroupId !== groupId) {
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(canViewClasses ? '/classes' : '/my-classes')}>
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
          sx={{ minHeight: { xs: 40, sm: 'unset' } }}
          disabled={!lessonDate}
          onClick={() => navigate(`/classes/${group.id}/lessons/${lessonDate}`)}
        >
          Відмітити заняття
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, p: 2 }}>
          <Typography sx={{ fontWeight: 700, mr: 'auto' }}>Склад ({group.activeMembers})</Typography>
          {canManage && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setAddMemberOpen(true)}>
              Додати дитину
            </Button>
          )}
        </Box>
        {isPhone ? (
            <Box sx={{ px: 2, pb: 2 }}>
              <CardList
                items={group.members}
                getKey={(m) => m.id}
                empty={<Typography variant="body2" color="text.secondary">Дітей ще немає.</Typography>}
                renderCard={(m) => (
                  <>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{m.child.lastName} {m.child.firstName}</Typography>
                    <CardField label="З">{formatDay(m.startDate)}</CardField>
                    <CardField label="По">{m.endDate ? formatDay(m.endDate) : '—'}</CardField>
                    {canManage && !m.endDate && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                        <Button
                          color="error"
                          disabled={isSaving}
                          onClick={() => endMember(m.id, localToday()).catch(() => undefined)}
                        >
                          Вивести сьогодні
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              />
            </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
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
                        {canManage && !m.endDate && (
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
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 700, p: 2 }}>Заняття</Typography>
        {isPhone ? (
            <Box sx={{ px: 2, pb: 2 }}>
              <CardList
                items={group.lessons}
                getKey={(l) => l.id}
                empty={<Typography variant="body2" color="text.secondary">Занять ще не було.</Typography>}
                renderCard={(l) => (
                  <Box onClick={() => navigate(`/classes/${group.id}/lessons/${l.date.slice(0, 10)}`)} sx={{ cursor: 'pointer' }}>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{formatDay(l.date)}</Typography>
                    <CardField label="Провів">{l.conductedBy.lastName} {l.conductedBy.firstName}</CardField>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
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
                  </Box>
                )}
              />
            </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
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
          </Box>
        )}
      </Paper>

      {canManage && <AddMemberModal />}
    </Box>
  )
}
