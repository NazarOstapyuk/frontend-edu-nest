import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useInstitutionsStore } from '../model/institutionsStore'
import { useStructureStore } from '../model/structureStore'
import { unitWording } from '../model/wording'
import type { Child, Group } from '../../../shared/api'
import { useAuthStore, useCan, useUserLookupStore } from '../../../entities/user'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import { CreateUserModal } from '../../../widgets/userForms'
import { usersApi, type CreateUserDto } from '../../../shared/api'
import { CreateGroupModal, EditGroupModal } from '../../../widgets/groupForms'
import { CreateChildModal, EditChildModal } from '../../../widgets/childForms'
import { CreateInstitutionModal } from './CreateInstitutionModal'
import { EditInstitutionModal } from './EditInstitutionModal'
import { InstitutionBlock } from './InstitutionBlock'

export const InstitutionsPage = () => {
  const institutions = useInstitutionsStore((s) => s.institutions)
  const fetchInstitutions = useInstitutionsStore((s) => s.fetchInstitutions)
  const setCreateInstitutionModal = useInstitutionsStore((s) => s.setCreateInstitutionModal)
  const selectedId = useInstitutionStore((s) => s.selectedId)

  const groups = useStructureStore((s) => s.groups)
  const children = useStructureStore((s) => s.children)
  const teachers = useUserLookupStore((s) => s.teachers)
  const parents = useUserLookupStore((s) => s.parents)
  const fetchTeachers = useUserLookupStore((s) => s.fetchTeachers)
  const fetchParents = useUserLookupStore((s) => s.fetchParents)
  const bellSchedules = useStructureStore((s) => s.bellSchedules)
  const mealCategories = useStructureStore((s) => s.mealCategories)
  const fetchStructure = useStructureStore((s) => s.fetchStructure)
  const fetchLookups = useStructureStore((s) => s.fetchLookups)
  const isCreating = useStructureStore((s) => s.isCreating)
  const isUpdating = useStructureStore((s) => s.isUpdating)
  const createGroupModal = useStructureStore((s) => s.createGroupModal)
  const editGroupModal = useStructureStore((s) => s.editGroupModal)
  const createChildModal = useStructureStore((s) => s.createChildModal)
  const editChildModal = useStructureStore((s) => s.editChildModal)
  const setCreateGroupModal = useStructureStore((s) => s.setCreateGroupModal)
  const setEditGroupModal = useStructureStore((s) => s.setEditGroupModal)
  const setCreateChildModal = useStructureStore((s) => s.setCreateChildModal)
  const setEditChildModal = useStructureStore((s) => s.setEditChildModal)
  const createGroup = useStructureStore((s) => s.createGroup)
  const updateGroup = useStructureStore((s) => s.updateGroup)
  const createChild = useStructureStore((s) => s.createChild)
  const updateChild = useStructureStore((s) => s.updateChild)

  const canEditSettings = useCan('settings', 'edit')
  const isFullScope = useAuthStore((s) => s.profile?.role === 'root' || s.profile?.accessScope === 'all')
  const canEdit = canEditSettings && isFullScope
  const canViewGroups = useCan('children', 'view')
  const canEditGroups = useCan('children', 'edit')
  const canCreateUsers = useCan('users', 'edit')
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newParentId, setNewParentId] = useState<string | null>(null)
  const createParent = async (dto: CreateUserDto) => {
    setIsCreatingUser(true)
    try {
      const { data } = await usersApi.create(dto)
      await fetchParents().catch(() => undefined)
      if (data.role === 'parent') setNewParentId(data.id)
      return data
    } finally {
      setIsCreatingUser(false)
    }
  }

  useEffect(() => {
    fetchInstitutions()
  }, [fetchInstitutions])

  useEffect(() => {
    if (!canViewGroups) return
    fetchStructure(canEditGroups).catch(() => undefined)
  }, [canViewGroups, canEditGroups, fetchStructure])

  useEffect(() => {
    if (!canEditGroups) return
    fetchLookups().catch(() => undefined)
    fetchTeachers().catch(() => undefined)
    fetchParents().catch(() => undefined)
  }, [canEditGroups, fetchLookups, fetchTeachers, fetchParents])

  const visible = selectedId ? institutions.filter((i) => i.id === selectedId) : institutions

  const groupsByInstitution = useMemo(() => {
    const map = new Map<string, Group[]>()
    for (const group of groups) {
      const list = map.get(group.institution.id) ?? []
      list.push(group)
      map.set(group.institution.id, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'uk', { numeric: true }))
    return map
  }, [groups])

  const childrenById = useMemo(() => new Map<string, Child>(children.map((c) => [c.id, c])), [children])

  const lockedInstitution = institutions.find((i) => i.id === createGroupModal.institutionId)
  const editedGroupType = editGroupModal.group?.institution.type

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього закладів: {visible.length}
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateInstitutionModal({ isOpen: true })}
          >
            Створити заклад
          </Button>
        )}
      </Box>

      {visible.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, py: 6, textAlign: 'center', color: 'text.secondary' }}
        >
          Закладів ще немає.
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visible.map((institution) => (
            <InstitutionBlock
              key={institution.id}
              institution={institution}
              groups={groupsByInstitution.get(institution.id) ?? []}
              childrenById={childrenById}
              defaultExpanded={!!selectedId}
              canEditInstitution={canEdit}
              canViewGroups={canViewGroups}
              canEditGroups={canEditGroups}
            />
          ))}
        </Box>
      )}

      <CreateInstitutionModal />
      <EditInstitutionModal />

      {canEditGroups && (
        <>
          {canCreateUsers && (
            <CreateUserModal
              isOpen={userModalOpen}
              isSubmitting={isCreatingUser}
              presetParent
              onSubmit={createParent}
              onClose={() => setUserModalOpen(false)}
            />
          )}
          <CreateGroupModal
            isOpen={createGroupModal.isOpen}
            isSubmitting={isCreating}
            teachers={teachers}
            bellSchedules={bellSchedules}
            mealCategories={mealCategories}
            lockedInstitutionId={createGroupModal.institutionId}
            title={lockedInstitution ? unitWording[lockedInstitution.type].create : undefined}
            onSubmit={createGroup}
            onClose={() => setCreateGroupModal({ isOpen: false, institutionId: null })}
          />
          <EditGroupModal
            isOpen={editGroupModal.isOpen}
            group={editGroupModal.group}
            isSubmitting={isUpdating}
            teachers={teachers}
            bellSchedules={bellSchedules}
            mealCategories={mealCategories}
            title={editedGroupType ? unitWording[editedGroupType].edit : undefined}
            onSubmit={updateGroup}
            onClose={() => setEditGroupModal({ isOpen: false, group: null })}
          />
          <CreateChildModal
            isOpen={createChildModal.isOpen}
            isSubmitting={isCreating}
            parents={parents}
            onCreateParent={canCreateUsers ? () => setUserModalOpen(true) : undefined}
            newParentId={newParentId}
            groups={groups}
            presetGroupId={createChildModal.groupId}
            onSubmit={createChild}
            onClose={() => setCreateChildModal({ isOpen: false, groupId: null })}
          />
          <EditChildModal
            isOpen={editChildModal.isOpen}
            child={editChildModal.child}
            isSubmitting={isUpdating}
            parents={parents}
            onCreateParent={canCreateUsers ? () => setUserModalOpen(true) : undefined}
            newParentId={newParentId}
            groups={groups}
            onSubmit={updateChild}
            onClose={() => setEditChildModal({ isOpen: false, child: null })}
          />
        </>
      )}
    </Box>
  )
}
