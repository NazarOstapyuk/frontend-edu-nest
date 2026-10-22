import { useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useGroupsStore } from '../model/groupsStore'
import { useUsersStore } from '../../users/model/usersStore'
import { groupKindLabels } from '../../../shared/api'
import { useCan } from '../../../entities/user'
import { CreateGroupModal } from './CreateGroupModal'
import { EditGroupModal } from './EditGroupModal'

export const GroupsPage = () => {
  const groups = useGroupsStore((s) => s.groups)
  const fetchGroups = useGroupsStore((s) => s.fetchGroups)
  const fetchBellSchedules = useGroupsStore((s) => s.fetchBellSchedules)
  const fetchMealCategories = useGroupsStore((s) => s.fetchMealCategories)
  const setCreateGroupModal = useGroupsStore((s) => s.setCreateGroupModal)
  const setEditGroupModal = useGroupsStore((s) => s.setEditGroupModal)
  const deleteGroup = useGroupsStore((s) => s.deleteGroup)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const canEdit = useCan('children', 'edit')

  useEffect(() => {
    fetchGroups()
    fetchUsers()
    fetchBellSchedules().catch(() => undefined)
    fetchMealCategories().catch(() => undefined)
  }, [fetchGroups, fetchUsers, fetchBellSchedules, fetchMealCategories])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього груп: {groups.length}
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateGroupModal({ isOpen: true })}
          >
            Створити групу
          </Button>
        )}
      </Box>

      {groups.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          Груп ще немає. Натисніть «Створити групу».
        </Box>
      ) : (
        <Grid container spacing={2}>
          {groups.map((group) => (
            <Grid key={group.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
                    {group.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    <Chip size="small" label={groupKindLabels[group.kind]} />
                    <Chip size="small" variant="outlined" label={group.institution.name} />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {group.teachers.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Вчителів немає
                      </Typography>
                    ) : (
                      group.teachers.map((teacher) => (
                        <Chip
                          key={teacher.id}
                          label={`${teacher.lastName} ${teacher.firstName}`}
                          size="small"
                          variant="outlined"
                        />
                      ))
                    )}
                  </Box>
                </CardContent>
                {canEdit && (
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Tooltip title="Редагувати">
                      <IconButton
                        size="small"
                        onClick={() => setEditGroupModal({ isOpen: true, group })}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton size="small" color="error" onClick={() => deleteGroup(group.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CreateGroupModal />
      <EditGroupModal />
    </Box>
  )
}
