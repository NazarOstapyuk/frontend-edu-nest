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
import { roleLabels } from '../../../entities/user'
import { useUsersStore } from '../model/usersStore'
import { CreateUserModal } from './CreateUserModal.tsx'
import { EditUserModal } from './EditUserModal.tsx'

const roleColors: Record<string, 'primary' | 'secondary'> = {
  teacher: 'primary',
  parent:  'secondary',
}

export const UsersPage = () => {
  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const setCreateUserModal = useUsersStore((s) => s.setCreateUserModal)
  const setEditUserModal = useUsersStore((s) => s.setEditUserModal)
  const deleteUser = useUsersStore((s) => s.deleteUser)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього користувачів: {users.length}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateUserModal({ isOpen: true })}
        >
          Створити користувача
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
              <TableCell>Роль</TableCell>
              <TableCell>Логін</TableCell>
              <TableCell>Дата створення</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Користувачів ще немає. Натисніть «Створити користувача».
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {user.lastName} {user.firstName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={roleLabels[user.role]}
                      color={roleColors[user.role]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{user.login}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{user.createdAt}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Редагувати">
                      <IconButton size="small" onClick={() => setEditUserModal({ isOpen: true, user })}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton size="small" color="error" onClick={() => deleteUser(user.id)}>
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

      <CreateUserModal />
      <EditUserModal />
    </Box>
  )
}
