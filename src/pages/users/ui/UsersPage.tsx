import { useEffect, useState } from 'react'
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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { roleLabels, useCan, type User } from '../../../entities/user'
import { useUsersStore } from '../model/usersStore'
import { CreateUserModal } from './CreateUserModal.tsx'
import { EditUserModal } from './EditUserModal.tsx'
import { AccessDialog } from './AccessDialog.tsx'

const roleColors: Record<string, 'primary' | 'secondary' | 'default'> = {
  admin: 'default',
  teacher: 'primary',
  parent:  'secondary',
}

export const UsersPage = () => {
  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const setCreateUserModal = useUsersStore((s) => s.setCreateUserModal)
  const setEditUserModal = useUsersStore((s) => s.setEditUserModal)
  const deleteUser = useUsersStore((s) => s.deleteUser)
  const replaceUser = useUsersStore((s) => s.replaceUser)
  const canEditUsers = useCan('users', 'edit')
  const [accessUser, setAccessUser] = useState<User | null>(null)

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
              <TableCell>Телефон</TableCell>
              <TableCell>Логін</TableCell>
              <TableCell>Дата створення</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
                    {[user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={roleLabels[user.role]}
                      color={roleColors[user.role]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {user.phone ?? '—'}
                    {user.role === 'parent' && !user.phone && (
                      <Chip size="small" color="warning" label="немає телефону" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{user.login}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{user.createdAt}</TableCell>
                  <TableCell align="right">
                    {canEditUsers && user.role !== 'parent' && (
                      <Tooltip title="Доступ">
                        <IconButton size="small" onClick={() => setAccessUser(user)}>
                          <AdminPanelSettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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
      {accessUser && (
        <AccessDialog
          user={accessUser}
          onClose={() => setAccessUser(null)}
          onSaved={replaceUser}
        />
      )}
    </Box>
  )
}
