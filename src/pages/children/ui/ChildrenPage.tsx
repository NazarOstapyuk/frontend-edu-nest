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
import { useChildrenStore } from '../model/childrenStore'
import { useUsersStore } from '../../users/model/usersStore'
import { useGroupsStore } from '../../groups/model/groupsStore'
import { CreateChildModal } from './CreateChildModal'
import { EditChildModal } from './EditChildModal'

export const ChildrenPage = () => {
  const children = useChildrenStore((s) => s.children)
  const fetchChildren = useChildrenStore((s) => s.fetchChildren)
  const setCreateChildModal = useChildrenStore((s) => s.setCreateChildModal)
  const setEditChildModal = useChildrenStore((s) => s.setEditChildModal)
  const deleteChild = useChildrenStore((s) => s.deleteChild)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const fetchGroups = useGroupsStore((s) => s.fetchGroups)

  useEffect(() => {
    fetchChildren()
    fetchUsers()
    fetchGroups()
  }, [fetchChildren, fetchUsers, fetchGroups])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього учнів: {children.length}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateChildModal({ isOpen: true })}
        >
          Створити учня
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>#</TableCell>
              <TableCell>Ім'я та прізвище</TableCell>
              <TableCell>Дата народження</TableCell>
              <TableCell>Група</TableCell>
              <TableCell>Батьки</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {children.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Учнів ще немає. Натисніть «Створити учня».
                </TableCell>
              </TableRow>
            ) : (
              children.map((child, index) => (
                <TableRow key={child.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {child.lastName} {child.firstName}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(child.birthDate).toLocaleDateString('uk-UA')}
                  </TableCell>
                  <TableCell>
                    {child.group ? (
                      <Chip label={child.group.name} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {child.parents.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      ) : (
                        child.parents.map((parent) => (
                          <Chip
                            key={parent.id}
                            label={`${parent.lastName} ${parent.firstName}`}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Редагувати">
                      <IconButton
                        size="small"
                        onClick={() => setEditChildModal({ isOpen: true, child })}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton size="small" color="error" onClick={() => deleteChild(child.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateChildModal />
      <EditChildModal />
    </Box>
  )
}
