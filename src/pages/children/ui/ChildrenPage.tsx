import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useChildrenStore } from '../model/childrenStore'
import { useUsersStore } from '../../users/model/usersStore'
import { useGroupsStore } from '../../groups/model/groupsStore'
import { genderLabels } from '../../../shared/api'
import { useCan } from '../../../entities/user'
import { CreateChildModal, EditChildModal } from '../../../widgets/childForms'
import { HistoryButton } from '../../../widgets/auditHistory'

export const ChildrenPage = () => {
  const children = useChildrenStore((s) => s.children)
  const fetchChildren = useChildrenStore((s) => s.fetchChildren)
  const setCreateChildModal = useChildrenStore((s) => s.setCreateChildModal)
  const setEditChildModal = useChildrenStore((s) => s.setEditChildModal)
  const deleteChild = useChildrenStore((s) => s.deleteChild)
  const createChildModal = useChildrenStore((s) => s.createChildModal)
  const editChildModal = useChildrenStore((s) => s.editChildModal)
  const createChild = useChildrenStore((s) => s.createChild)
  const updateChild = useChildrenStore((s) => s.updateChild)
  const isCreating = useChildrenStore((s) => s.isCreating)
  const isUpdating = useChildrenStore((s) => s.isUpdating)
  const navigate = useNavigate()
  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const groups = useGroupsStore((s) => s.groups)
  const fetchGroups = useGroupsStore((s) => s.fetchGroups)
  const canEdit = useCan('children', 'edit')
  const canViewFinance = useCan('finance', 'view')
  const [selectedGroupId, setGroupId] = useState('')
  const groupId = groups.some((g) => g.id === selectedGroupId) ? selectedGroupId : ''

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, 'uk')),
    [groups],
  )
  const visibleChildren = useMemo(
    () => (groupId ? children.filter((c) => c.group?.id === groupId) : children),
    [children, groupId],
  )

  useEffect(() => {
    fetchChildren()
    fetchUsers()
    fetchGroups()
  }, [fetchChildren, fetchUsers, fetchGroups])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            select
            size="small"
            label="Група"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Усі групи</MenuItem>
            {sortedGroups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.institution ? `${g.name} · ${g.institution.name}` : g.name}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            {groupId ? `Учнів у групі: ${visibleChildren.length} із ${children.length}` : `Всього учнів: ${children.length}`}
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateChildModal({ isOpen: true })}
          >
            Створити учня
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
              <TableCell>#</TableCell>
              <TableCell>Ім'я та прізвище</TableCell>
              <TableCell>Дата народження</TableCell>
              <TableCell>Стать</TableCell>
              <TableCell>Група</TableCell>
              <TableCell>Батьки</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleChildren.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {groupId ? 'У цій групі учнів немає.' : 'Учнів ще немає. Натисніть «Створити учня».'}
                </TableCell>
              </TableRow>
            ) : (
              visibleChildren.map((child, index) => (
                <TableRow key={child.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {[child.lastName, child.firstName, child.middleName].filter(Boolean).join(' ')}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(child.birthDate).toLocaleDateString('uk-UA')}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {genderLabels[child.gender]}
                  </TableCell>
                  <TableCell>
                    {child.group ? (
                      <Chip label={child.group.institution ? `${child.group.name} · ${child.group.institution.name}` : child.group.name} size="small" variant="outlined" />
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
                    <HistoryButton
                      entityType="children"
                      entityId={child.id}
                      title={`${child.lastName} ${child.firstName}`}
                    />
                    {canViewFinance && (
                      <Tooltip title="Фінанси">
                        <IconButton size="small" onClick={() => navigate(`/finance/${child.id}`)}>
                          <AccountBalanceWalletOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <Tooltip title="Редагувати">
                        <IconButton
                          size="small"
                          onClick={() => setEditChildModal({ isOpen: true, child })}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <Tooltip title="Видалити">
                        <IconButton size="small" color="error" onClick={() => deleteChild(child.id)}>
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

      <CreateChildModal
        isOpen={createChildModal.isOpen}
        isSubmitting={isCreating}
        users={users}
        groups={groups}
        onSubmit={createChild}
        onClose={() => setCreateChildModal({ isOpen: false })}
      />
      <EditChildModal
        isOpen={editChildModal.isOpen}
        child={editChildModal.child}
        isSubmitting={isUpdating}
        users={users}
        groups={groups}
        onSubmit={updateChild}
        onClose={() => setEditChildModal({ isOpen: false, child: null })}
      />
    </Box>
  )
}
