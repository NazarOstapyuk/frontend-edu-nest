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
  TablePagination,
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
import { genderLabels, type Child } from '../../../shared/api'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { CreateUserModal } from '../../users/ui/CreateUserModal'
import { useCan } from '../../../entities/user'
import { CreateChildModal, EditChildModal } from '../../../widgets/childForms'
import { HistoryButton } from '../../../widgets/auditHistory'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'

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
  const isPhone = useIsPhone()
  const parents = useUsersStore((s) => s.parents)
  const fetchParents = useUsersStore((s) => s.fetchParents)
  const userModalOpen = useUsersStore((s) => s.createUserModal.isOpen)
  const setCreateUserModal = useUsersStore((s) => s.setCreateUserModal)
  const canCreateUsers = useCan('users', 'edit')
  const [deletingChild, setDeletingChild] = useState<Child | null>(null)
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
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const lastPage = Math.max(0, Math.ceil(visibleChildren.length / rowsPerPage) - 1)
  const currentPage = Math.min(page, lastPage)
  const pagedChildren = visibleChildren.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)

  const childName = (child: (typeof children)[number]) =>
    [child.lastName, child.firstName, child.middleName].filter(Boolean).join(' ')
  const groupLabel = (child: (typeof children)[number]) =>
    child.group ? (child.group.institution ? `${child.group.name} · ${child.group.institution.name}` : child.group.name) : null
  const parentChips = (child: (typeof children)[number]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {child.parents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">—</Typography>
      ) : (
        child.parents.map((parent) => (
          <Chip key={parent.id} label={`${parent.lastName} ${parent.firstName}`} size="small" variant="outlined" />
        ))
      )}
    </Box>
  )
  const actions = (child: (typeof children)[number]) => (
    <>
      <HistoryButton entityType="children" entityId={child.id} title={`${child.lastName} ${child.firstName}`} />
      {canViewFinance && (
        <Tooltip title="Фінанси">
          <IconButton size="small" onClick={() => navigate(`/finance/${child.id}`)}>
            <AccountBalanceWalletOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canEdit && (
        <Tooltip title="Редагувати">
          <IconButton size="small" onClick={() => setEditChildModal({ isOpen: true, child })}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canEdit && (
        <Tooltip title="Видалити">
          <IconButton size="small" color="error" onClick={() => setDeletingChild(child)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  )

  useEffect(() => {
    fetchChildren()
    fetchGroups()
  }, [fetchChildren, fetchGroups])

  useEffect(() => {
    if (!userModalOpen) fetchParents().catch(() => undefined)
  }, [userModalOpen, fetchParents])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            select
            size="small"
            label="Група"
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: { xs: 0, sm: 220 }, width: { xs: '100%', sm: 'auto' } }}
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

      {isPhone ? (
        <>
          <CardList
            items={pagedChildren}
            getKey={(c) => c.id}
            empty={
              <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
                {groupId ? 'У цій групі учнів немає.' : 'Учнів ще немає. Натисніть «Створити учня».'}
              </Typography>
            }
            renderCard={(child) => (
              <>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{childName(child)}</Typography>
                <CardField label="Дата народження">{new Date(child.birthDate).toLocaleDateString('uk-UA')}</CardField>
                <CardField label="Стать">{genderLabels[child.gender]}</CardField>
                <CardField label="Група">{groupLabel(child) ?? '—'}</CardField>
                <CardField label="Батьки">{parentChips(child)}</CardField>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>{actions(child)}</Box>
              </>
            )}
          />
          {visibleChildren.length > 0 && (
            <TablePagination
              component="div"
              count={visibleChildren.length}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
              onPageChange={(_, next) => setPage(next)}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} з ${count}`}
            />
          )}
        </>
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
              pagedChildren.map((child, index) => (
                <TableRow key={child.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{currentPage * rowsPerPage + index + 1}</TableCell>
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
                        <IconButton size="small" color="error" onClick={() => setDeletingChild(child)}>
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
        {visibleChildren.length > 0 && (
          <TablePagination
            component="div"
            count={visibleChildren.length}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value))
              setPage(0)
            }}
            labelRowsPerPage="Рядків на сторінці:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} з ${count}`}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </TableContainer>
      )}

      <ConfirmDialog
        open={deletingChild !== null}
        title="Видалити учня?"
        text={deletingChild ? `${childName(deletingChild)} буде видалено без можливості відновлення.` : undefined}
        onConfirm={() => deletingChild && deleteChild(deletingChild.id)}
        onClose={() => setDeletingChild(null)}
      />
      {canCreateUsers && <CreateUserModal />}
      <CreateChildModal
        isOpen={createChildModal.isOpen}
        isSubmitting={isCreating}
        parents={parents}
        onCreateParent={canCreateUsers ? () => setCreateUserModal({ isOpen: true }) : undefined}
        presetGroupId={groupId || null}
        groups={groups}
        onSubmit={createChild}
        onClose={() => setCreateChildModal({ isOpen: false })}
      />
      <EditChildModal
        isOpen={editChildModal.isOpen}
        child={editChildModal.child}
        isSubmitting={isUpdating}
        parents={parents}
        onCreateParent={canCreateUsers ? () => setCreateUserModal({ isOpen: true }) : undefined}
        groups={groups}
        onSubmit={updateChild}
        onClose={() => setEditChildModal({ isOpen: false, child: null })}
      />
    </Box>
  )
}
