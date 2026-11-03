import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import type { NoteSet } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useNotesStore } from '../model/notesStore'
import { NoteSetDialog } from './NoteSetDialog'

const groupNames = (set: NoteSet) => (set.groups.length > 0 ? set.groups.map((g) => g.name).join(', ') : '—')
const questionCount = (set: NoteSet) => set.questions.filter((q) => q.active).length

export const QuestionsTab = () => {
  const sets = useNotesStore((s) => s.sets)
  const setsLoaded = useNotesStore((s) => s.setsLoaded)
  const setsError = useNotesStore((s) => s.setsError)
  const isUpdating = useNotesStore((s) => s.isUpdating)
  const loadSets = useNotesStore((s) => s.loadSets)
  const updateSet = useNotesStore((s) => s.updateSet)
  const deleteSet = useNotesStore((s) => s.deleteSet)
  const setSetDialog = useNotesStore((s) => s.setSetDialog)
  const isPhone = useIsPhone()
  const [toDelete, setToDelete] = useState<NoteSet | null>(null)

  useEffect(() => {
    loadSets().catch(() => undefined)
  }, [loadSets])

  if (setsError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => loadSets().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  if (!setsLoaded) return <Typography color="text.secondary">Завантаження…</Typography>

  const activeSwitch = (set: NoteSet) => (
    <Switch
      checked={set.active}
      disabled={isUpdating}
      onChange={(e) => updateSet(set.id, { active: e.target.checked }).catch(() => undefined)}
      slotProps={{ input: { 'aria-label': 'Активний' } }}
    />
  )

  const actions = (set: NoteSet) => (
    <>
      <Tooltip title="Редагувати">
        <IconButton size={isPhone ? 'medium' : 'small'} onClick={() => setSetDialog({ isOpen: true, set })}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Видалити">
        <IconButton size={isPhone ? 'medium' : 'small'} color="error" onClick={() => setToDelete(set)}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  )

  const empty = 'Наборів питань ще немає. Натисніть «Створити набір».'

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">Всього наборів: {sets.length}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setSetDialog({ isOpen: true, set: null })}>
          Створити набір
        </Button>
      </Box>

      {isPhone ? (
        <CardList
          items={sets}
          getKey={(s) => s.id}
          empty={<Typography color="text.secondary" align="center" sx={{ py: 6 }}>{empty}</Typography>}
          renderCard={(set) => (
            <>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{set.name}</Typography>
              <CardField label="Заклад">{set.institution.name}</CardField>
              <CardField label="Групи">{groupNames(set)}</CardField>
              <CardField label="Питань">{questionCount(set)}</CardField>
              <CardField label="Дедлайн">{set.deadline}</CardField>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {activeSwitch(set)}
                <Typography variant="body2" sx={{ mr: 'auto' }}>{set.active ? 'Активний' : 'Вимкнений'}</Typography>
                {actions(set)}
              </Box>
            </>
          )}
        />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Назва</TableCell>
                <TableCell>Заклад</TableCell>
                <TableCell>Групи</TableCell>
                <TableCell>Питань</TableCell>
                <TableCell>Дедлайн</TableCell>
                <TableCell>Активний</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>{empty}</TableCell>
                </TableRow>
              ) : (
                sets.map((set) => (
                  <TableRow key={set.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{set.name}</TableCell>
                    <TableCell>{set.institution.name}</TableCell>
                    <TableCell>{groupNames(set)}</TableCell>
                    <TableCell>{questionCount(set)}</TableCell>
                    <TableCell>{set.deadline}</TableCell>
                    <TableCell>{activeSwitch(set)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{actions(set)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <NoteSetDialog />
      <ConfirmDialog
        open={!!toDelete}
        title="Видалити набір питань?"
        text={toDelete ? `Набір «${toDelete.name}» буде видалено. Набір, який уже має відповіді, можна лише вимкнути.` : undefined}
        onConfirm={() => (toDelete ? deleteSet(toDelete.id) : undefined)}
        onClose={() => setToDelete(null)}
      />
    </Box>
  )
}
