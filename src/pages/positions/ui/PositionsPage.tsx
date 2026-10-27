import { useEffect } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useCan, useCanManageShared } from '../../../entities/user'
import { usePositionsStore } from '../../../entities/position'
import { usePositionsPageStore } from '../model/positionsPageStore'
import { PositionDialog } from './PositionDialog'
import { DeletePositionDialog } from './DeletePositionDialog'

export const PositionsPage = () => {
  const positions = usePositionsStore((s) => s.positions)
  const load = usePositionsStore((s) => s.load)
  const setCreateModal = usePositionsPageStore((s) => s.setCreateModal)
  const setEditModal = usePositionsPageStore((s) => s.setEditModal)
  const setDeleteModal = usePositionsPageStore((s) => s.setDeleteModal)
  const canEditUsers = useCan('users', 'edit')
  const canManageShared = useCanManageShared()
  const canEdit = canEditUsers && canManageShared

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього посад: {positions.length}
        </Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModal({ isOpen: true })}>
            Створити посаду
          </Button>
        )}
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Назва</TableCell>
              <TableCell>Педагогічна</TableCell>
              <TableCell>Працівників</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Посад ще немає. Натисніть «Створити посаду».
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ fontWeight: 500 }}>{position.name}</TableCell>
                  <TableCell>
                    {position.teaching && <Chip label="Педагогічна" color="primary" size="small" variant="outlined" />}
                  </TableCell>
                  <TableCell>{position.userCount}</TableCell>
                  <TableCell align="right">
                    {canEdit && (
                      <Tooltip title="Редагувати">
                        <IconButton size="small" onClick={() => setEditModal({ isOpen: true, position })}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && position.userCount === 0 && (
                      <Tooltip title="Видалити">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteModal({ isOpen: true, position })}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PositionDialog />
      <DeletePositionDialog />
    </Box>
  )
}
