import { useEffect, useMemo } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useInstitutionsStore } from '../model/institutionsStore'
import { useStructureStore } from '../model/structureStore'
import { unitWording } from '../model/wording'
import type { Child, Group } from '../../../shared/api'
import { useAuthStore, useCan } from '../../../entities/user'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
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
  const users = useStructureStore((s) => s.users)
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

  useEffect(() => {
    fetchInstitutions()
  }, [fetchInstitutions])

  useEffect(() => {
    if (!canViewGroups) return
    fetchStructure(canEditGroups).catch(() => undefined)
    if (canEditGroups) fetchLookups().catch(() => undefined)
  }, [canViewGroups, canEditGroups, fetchStructure, fetchLookups])

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
          <CreateGroupModal
            isOpen={createGroupModal.isOpen}
            isSubmitting={isCreating}
            users={users}
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
            users={users}
            bellSchedules={bellSchedules}
            mealCategories={mealCategories}
            title={editedGroupType ? unitWording[editedGroupType].edit : undefined}
            onSubmit={updateGroup}
            onClose={() => setEditGroupModal({ isOpen: false, group: null })}
          />
          <CreateChildModal
            isOpen={createChildModal.isOpen}
            isSubmitting={isCreating}
            users={users}
            groups={groups}
            presetGroupId={createChildModal.groupId}
            onSubmit={createChild}
            onClose={() => setCreateChildModal({ isOpen: false, groupId: null })}
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
        </>
      )}
    </Box>
  )
}
