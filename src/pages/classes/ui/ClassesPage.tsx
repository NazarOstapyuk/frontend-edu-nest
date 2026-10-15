import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useClassesStore } from '../model/classesStore'
import { useCan } from '../../../entities/user'
import { classFormatLabels, missedRuleLabels } from '../../../shared/api'
import { DirectionModal } from './DirectionModal'
import { GroupModal } from './GroupModal'
import { ReconciliationDialog } from './ReconciliationDialog'

export const ClassesPage = () => {
  const directions = useClassesStore((s) => s.directions)
  const reconciliation = useClassesStore((s) => s.reconciliation)
  const isSaving = useClassesStore((s) => s.isSaving)
  const fetchAll = useClassesStore((s) => s.fetchAll)
  const setDirectionModal = useClassesStore((s) => s.setDirectionModal)
  const setGroupModal = useClassesStore((s) => s.setGroupModal)
  const setReconciliationOpen = useClassesStore((s) => s.setReconciliationOpen)
  const migrateLegacy = useClassesStore((s) => s.migrateLegacy)
  const navigate = useNavigate()
  const canEdit = useCan('classes', 'edit')

  useEffect(() => {
    fetchAll().catch(() => undefined)
  }, [fetchAll])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
          Напрямів: {directions.length}
        </Typography>
        {canEdit && reconciliation.length > 0 && (
          <Button color="warning" variant="outlined" onClick={() => setReconciliationOpen(true)}>
            Потребує звірки: {reconciliation.length}
          </Button>
        )}
        {canEdit && (
          <Button variant="outlined" disabled={isSaving} onClick={() => migrateLegacy().catch(() => undefined)}>
            Перенести старі абонементи
          </Button>
        )}
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDirectionModal({ isOpen: true, direction: null })}>
            Створити напрям
          </Button>
        )}
      </Box>

      {directions.length === 0 && (
        <Typography color="text.secondary">Напрямів ще немає. Натисніть «Створити напрям».</Typography>
      )}

      {directions.map((direction) => (
        <Paper key={direction.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>{direction.name}</Typography>
            <Chip size="small" variant="outlined" label={missedRuleLabels[direction.missedRule]} />
            {!direction.isActive && <Chip size="small" label="Неактивний" />}
            {canEdit && (
              <Tooltip title="Редагувати напрям">
                <IconButton size="small" onClick={() => setDirectionModal({ isOpen: true, direction })}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                sx={{ ml: 'auto' }}
                onClick={() => setGroupModal({ isOpen: true, directionId: direction.id, group: null })}
              >
                Створити групу
              </Button>
            )}
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Група</TableCell>
                <TableCell>Формат</TableCell>
                <TableCell>Педагоги</TableCell>
                <TableCell align="right">Дітей</TableCell>
                <TableCell>Тарифи</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {direction.groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ color: 'text.secondary' }}>Груп ще немає.</TableCell>
                </TableRow>
              ) : (
                direction.groups.map((group) => (
                  <TableRow key={group.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/classes/${group.id}`)}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {group.name}
                      {!group.isActive && ' (неактивна)'}
                    </TableCell>
                    <TableCell>{classFormatLabels[group.format]}</TableCell>
                    <TableCell>{group.teachers.map((t) => `${t.lastName} ${t.firstName}`).join(', ') || '—'}</TableCell>
                    <TableCell align="right">{group.activeMembers}</TableCell>
                    <TableCell>
                      {[group.singleTariff?.name, group.packageTariff?.name].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <Tooltip title="Редагувати групу">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setGroupModal({ isOpen: true, directionId: direction.id, group })
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      ))}

      <DirectionModal />
      <GroupModal />
      <ReconciliationDialog />
    </Box>
  )
}
