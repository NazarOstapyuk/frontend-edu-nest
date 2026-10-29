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
import { scopeLabels } from '../../../shared/api'
import { roleLabels, useCan, type User } from '../../../entities/user'
import { useUsersStore } from '../model/usersStore'
import { CreateUserModal } from './CreateUserModal.tsx'
import { EditUserModal } from './EditUserModal.tsx'
import { AccessDialog } from './AccessDialog.tsx'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import { HistoryButton } from '../../../widgets/auditHistory'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

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
  const institutions = useInstitutionStore((s) => s.institutions)
  const [accessUser, setAccessUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const isPhone = useIsPhone()

  const fullName = (user: User) => [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')
  const scopeText = (user: User) =>
    user.role === 'parent'
      ? '—'
      : user.accessScope === 'institutions'
        ? (user.institutionIds ?? [])
            .map((id) => institutions.find((i) => i.id === id)?.name)
            .filter(Boolean)
            .join(', ') || '—'
        : scopeLabels.all
  const roleChip = (user: User) => (
    <Chip
      label={user.role === 'parent' ? roleLabels.parent : (user.position?.name ?? '—')}
      color={roleColors[user.role]}
      size="small"
      variant="outlined"
    />
  )
  const actions = (user: User) => (
    <>
      <HistoryButton entityType="users" entityId={user.id} title={`${user.lastName} ${user.firstName}`} />
      {canEditUsers && user.role !== 'parent' && (
        <Tooltip title="Доступ">
          <IconButton size="small" onClick={() => setAccessUser(user)}>
            <AdminPanelSettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canEditUsers && (
        <Tooltip title="Редагувати">
          <IconButton size="small" onClick={() => setEditUserModal({ isOpen: true, user })}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canEditUsers && (
        <Tooltip title="Видалити">
          <IconButton size="small" color="error" onClick={() => setDeletingUser(user)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  )

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього користувачів: {users.length}
        </Typography>
        {canEditUsers && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateUserModal({ isOpen: true })}
          >
            Створити користувача
          </Button>
        )}
      </Box>

      {isPhone ? (
        <CardList
          items={users}
          getKey={(u) => u.id}
          empty={
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              Користувачів ще немає. Натисніть «Створити користувача».
            </Typography>
          }
          renderCard={(user) => (
            <>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{fullName(user)}</Typography>
              <Box sx={{ mb: 0.5 }}>{roleChip(user)}</Box>
              <CardField label="Телефон">
                {user.phone ?? '—'}
                {user.role === 'parent' && !user.phone && (
                  <Chip size="small" color="warning" label="немає телефону" sx={{ ml: 1 }} />
                )}
              </CardField>
              <CardField label="Заклади">{scopeText(user)}</CardField>
              <CardField label="Логін">
                <Box component="span" sx={{ fontFamily: 'monospace' }}>{user.login}</Box>
              </CardField>
              <CardField label="Створено">
                {new Date(user.createdAt).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' })}
              </CardField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>{actions(user)}</Box>
            </>
          )}
        />
      ) : (
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>#</TableCell>
              <TableCell>Ім'я та прізвище</TableCell>
              <TableCell>Посада</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Заклади</TableCell>
              <TableCell>Логін</TableCell>
              <TableCell>Дата створення</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
                      label={user.role === 'parent' ? roleLabels.parent : (user.position?.name ?? '—')}
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
                  <TableCell>
                    {user.role === 'parent'
                      ? '—'
                      : user.accessScope === 'institutions'
                        ? (user.institutionIds ?? [])
                            .map((id) => institutions.find((i) => i.id === id)?.name)
                            .filter(Boolean)
                            .join(', ') || '—'
                        : scopeLabels.all}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{user.login}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(user.createdAt).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' })}
                  </TableCell>
                  <TableCell align="right">
                    <HistoryButton
                      entityType="users"
                      entityId={user.id}
                      title={`${user.lastName} ${user.firstName}`}
                    />
                    {canEditUsers && user.role !== 'parent' && (
                      <Tooltip title="Доступ">
                        <IconButton size="small" onClick={() => setAccessUser(user)}>
                          <AdminPanelSettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEditUsers && (
                      <Tooltip title="Редагувати">
                        <IconButton size="small" onClick={() => setEditUserModal({ isOpen: true, user })}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEditUsers && (
                      <Tooltip title="Видалити">
                        <IconButton size="small" color="error" onClick={() => setDeletingUser(user)}>
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
      )}

      <ConfirmDialog
        open={deletingUser !== null}
        title="Видалити користувача?"
        text={deletingUser ? `${fullName(deletingUser)} буде видалено без можливості відновлення.` : undefined}
        onConfirm={() => deletingUser && deleteUser(deletingUser.id)}
        onClose={() => setDeletingUser(null)}
      />
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
