import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
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
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import { useClassesStore } from '../model/classesStore'
import { useCan } from '../../../entities/user'
import { classFormatLabels, missedRuleLabels, type ClassGroupSummary, type Direction } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { DirectionModal } from './DirectionModal'
import { GroupModal } from './GroupModal'
import { ReconciliationDialog } from './ReconciliationDialog'

const Teachers = ({ group }: { group: ClassGroupSummary }) =>
  group.teachers.length > 0 ? (
    <>{group.teachers.map((t) => `${t.lastName} ${t.firstName}`).join(', ')}</>
  ) : (
    <Box component="span" sx={{ color: 'warning.dark', fontWeight: 600 }}>Немає педагога</Box>
  )

const tariffNames = (group: ClassGroupSummary) =>
  [group.singleTariff?.name, group.packageTariff?.name].filter(Boolean).join(' · ') || '—'

const SingleGroup = ({ group }: { group: ClassGroupSummary }) => {
  const navigate = useNavigate()
  return (
    <Box
      onClick={() => navigate(`/classes/${group.id}`)}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: 'wrap',
        columnGap: 4,
        rowGap: 0.5,
        px: 2,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': { bgcolor: 'grey.50' },
      }}
    >
      <CardField label="Формат">{classFormatLabels[group.format]}</CardField>
      <CardField label="Педагоги"><Teachers group={group} /></CardField>
      <CardField label="Дітей">{group.activeMembers}</CardField>
      <CardField label="Тарифи">{tariffNames(group)}</CardField>
      {!group.isActive && <CardField label="Група">неактивна</CardField>}
    </Box>
  )
}

interface GroupListProps {
  direction: Direction
  canEdit: boolean
  onEdit: (group: ClassGroupSummary) => void
  onDelete: (group: ClassGroupSummary) => void
}

const GroupList = ({ direction, canEdit, onEdit, onDelete }: GroupListProps) => {
  const navigate = useNavigate()
  const isPhone = useIsPhone()

  if (isPhone)
    return (
      <Box sx={{ p: 2, pt: 0 }}>
        <CardList
          items={direction.groups}
          getKey={(g) => g.id}
          renderCard={(group) => (
            <Box onClick={() => navigate(`/classes/${group.id}`)} sx={{ cursor: 'pointer' }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                {group.name}
                {!group.isActive && ' (неактивна)'}
              </Typography>
              <CardField label="Формат">{classFormatLabels[group.format]}</CardField>
              <CardField label="Педагоги"><Teachers group={group} /></CardField>
              <CardField label="Дітей">{group.activeMembers}</CardField>
              <CardField label="Тарифи">{tariffNames(group)}</CardField>
              {canEdit && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                  <IconButton
                    aria-label="Редагувати групу гуртка"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(group)
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Видалити групу гуртка"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(group)
                    }}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        />
      </Box>
    )

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
            <TableCell>Група гуртка</TableCell>
            <TableCell>Формат</TableCell>
            <TableCell>Педагоги</TableCell>
            <TableCell align="right">Дітей</TableCell>
            <TableCell>Тарифи</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {direction.groups.map((group) => (
            <TableRow key={group.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/classes/${group.id}`)}>
              <TableCell sx={{ fontWeight: 500 }}>
                {group.name}
                {!group.isActive && ' (неактивна)'}
              </TableCell>
              <TableCell>{classFormatLabels[group.format]}</TableCell>
              <TableCell><Teachers group={group} /></TableCell>
              <TableCell align="right">{group.activeMembers}</TableCell>
              <TableCell>{tariffNames(group)}</TableCell>
              <TableCell align="right">
                {canEdit && (
                  <Tooltip title="Редагувати групу гуртка">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(group)
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {canEdit && (
                  <Tooltip title="Видалити групу гуртка">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(group)
                      }}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export const ClassesPage = () => {
  const directions = useClassesStore((s) => s.directions)
  const reconciliation = useClassesStore((s) => s.reconciliation)
  const isSaving = useClassesStore((s) => s.isSaving)
  const fetchAll = useClassesStore((s) => s.fetchAll)
  const setDirectionModal = useClassesStore((s) => s.setDirectionModal)
  const setGroupModal = useClassesStore((s) => s.setGroupModal)
  const setReconciliationOpen = useClassesStore((s) => s.setReconciliationOpen)
  const migrateLegacy = useClassesStore((s) => s.migrateLegacy)
  const setDirectionActive = useClassesStore((s) => s.setDirectionActive)
  const deleteDirection = useClassesStore((s) => s.deleteDirection)
  const deleteGroup = useClassesStore((s) => s.deleteGroup)
  const canEdit = useCan('classes', 'edit')
  const [deleting, setDeleting] = useState<Direction | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<ClassGroupSummary | null>(null)

  useEffect(() => {
    fetchAll().catch(() => undefined)
  }, [fetchAll])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
          Гуртків: {directions.length}
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
            Новий гурток
          </Button>
        )}
      </Box>

      {directions.length === 0 && (
        <Typography color="text.secondary">Гуртків ще немає. Натисніть «Новий гурток».</Typography>
      )}

      {directions.map((direction) => (
        <Paper
          key={direction.id}
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            mb: 2,
            overflow: 'hidden',
            ...(direction.isActive ? {} : { bgcolor: 'grey.50', color: 'text.secondary' }),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, p: 2 }}>
            <Typography sx={{ fontWeight: 700, color: 'inherit' }}>{direction.name}</Typography>
            <Chip size="small" variant="outlined" label={missedRuleLabels[direction.missedRule]} />
            {!direction.isActive && <Chip size="small" label="Вимкнено" />}
            {canEdit && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ml: 'auto' }}>
                <Button
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  onClick={() => setDirectionModal({ isOpen: true, direction })}
                >
                  Редагувати
                </Button>
                {direction.groups.length > 0 && (
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<AddIcon />}
                    onClick={() => setGroupModal({ isOpen: true, directionId: direction.id, group: null, defaultName: '' })}
                  >
                    Додати ще групу
                  </Button>
                )}
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<PowerSettingsNewIcon />}
                  disabled={isSaving}
                  onClick={() => setDirectionActive(direction.id, !direction.isActive).catch(() => undefined)}
                >
                  {direction.isActive ? 'Вимкнути' : 'Увімкнути'}
                </Button>
                <Button size="small" color="error" startIcon={<DeleteOutlinedIcon />} onClick={() => setDeleting(direction)}>
                  Видалити
                </Button>
              </Box>
            )}
          </Box>
          {direction.groups.length === 0 && (
            <Alert
              severity="warning"
              sx={{ mx: 2, mb: 2, alignItems: 'center' }}
              action={
                canEdit ? (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() =>
                      setGroupModal({ isOpen: true, directionId: direction.id, group: null, defaultName: direction.name })
                    }
                  >
                    Налаштувати
                  </Button>
                ) : undefined
              }
            >
              Немає групи: заняття не можна відмічати, пакети не купуються
            </Alert>
          )}
          {direction.groups.length === 1 && <SingleGroup group={direction.groups[0]} />}
          {direction.groups.length > 1 && (
            <GroupList
              direction={direction}
              canEdit={canEdit}
              onEdit={(group) => setGroupModal({ isOpen: true, directionId: direction.id, group, defaultName: '' })}
              onDelete={setDeletingGroup}
            />
          )}
        </Paper>
      ))}

      <DirectionModal />
      <GroupModal />
      <ReconciliationDialog />
      <ConfirmDialog
        open={!!deleting}
        title="Видалити гурток"
        text={deleting ? `Видалити гурток «${deleting.name}» разом з його групами? Це можна зробити, лише поки в ньому не було занять і пакетів.` : ''}
        onConfirm={() => deleting && deleteDirection(deleting.id)}
        onClose={() => setDeleting(null)}
      />
      <ConfirmDialog
        open={!!deletingGroup}
        title="Видалити групу"
        text={deletingGroup ? `Видалити групу «${deletingGroup.name}»? Це можна, поки в ній не було занять і ставок.` : ''}
        onConfirm={() => deletingGroup && deleteGroup(deletingGroup.id)}
        onClose={() => setDeletingGroup(null)}
      />
    </Box>
  )
}
