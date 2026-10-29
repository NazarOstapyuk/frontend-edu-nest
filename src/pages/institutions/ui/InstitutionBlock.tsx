import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { institutionTypeLabels, type Child, type Group, type Institution } from '../../../shared/api'
import { useInstitutionsStore } from '../model/institutionsStore'
import { useStructureStore } from '../model/structureStore'
import { unitWording } from '../model/wording'
import { GroupRow, GroupCard } from './GroupRow'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList } from '../../../shared/ui/CardList'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

interface InstitutionBlockProps {
  institution: Institution
  groups: Group[]
  childrenById: Map<string, Child>
  defaultExpanded: boolean
  canEditInstitution: boolean
  canViewGroups: boolean
  canEditGroups: boolean
}

export const InstitutionBlock = ({
  institution,
  groups,
  childrenById,
  defaultExpanded,
  canEditInstitution,
  canViewGroups,
  canEditGroups,
}: InstitutionBlockProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [deleting, setDeleting] = useState(false)
  const isPhone = useIsPhone()
  const setEditInstitutionModal = useInstitutionsStore((s) => s.setEditInstitutionModal)
  const deleteInstitution = useInstitutionsStore((s) => s.deleteInstitution)
  const isDeleting = useInstitutionsStore((s) => s.isDeleting)
  const setCreateGroupModal = useStructureStore((s) => s.setCreateGroupModal)
  const wording = unitWording[institution.type]
  const columns = canEditGroups ? 5 : 4
  const toggle = () => canViewGroups && setExpanded((v) => !v)

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, px: 2, py: 1.5 }}>
        {canViewGroups && (
          <IconButton size="small" onClick={toggle}>
            {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        )}
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, cursor: canViewGroups ? 'pointer' : 'default' }}
          onClick={toggle}
        >
          {institution.name}
        </Typography>
        <Chip size="small" label={institutionTypeLabels[institution.type]} />
        <Chip
          label={institution.isActive ? 'Активний' : 'Неактивний'}
          size="small"
          color={institution.isActive ? 'success' : 'default'}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        {canViewGroups && (
          <Typography variant="body2" color="text.secondary">
            {wording.title}: {groups.length}
          </Typography>
        )}
        {canEditInstitution && (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Редагувати">
              <IconButton
                size="small"
                onClick={() => setEditInstitutionModal({ isOpen: true, institution })}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Видалити (лише якщо заклад не використовується)">
              <IconButton
                size="small"
                color="error"
                disabled={isDeleting}
                onClick={() => setDeleting(true)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {canViewGroups && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {isPhone ? (
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
              <CardList
                items={groups}
                getKey={(g) => g.id}
                empty={
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    {wording.empty}
                  </Typography>
                }
                renderCard={(group) => (
                  <GroupCard group={group} childrenById={childrenById} canEdit={canEditGroups} />
                )}
              />
            </Box>
          ) : (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                  <TableCell sx={{ width: 48 }} />
                  <TableCell>{wording.column}</TableCell>
                  <TableCell>Вчителі</TableCell>
                  <TableCell>Дітей</TableCell>
                  {canEditGroups && <TableCell align="right">Дії</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {wording.empty}
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <GroupRow
                      key={group.id}
                      group={group}
                      childrenById={childrenById}
                      canEdit={canEditGroups}
                      columns={columns}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
          )}
          {canEditGroups && institution.isActive && (
            <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setCreateGroupModal({ isOpen: true, institutionId: institution.id })}
              >
                {wording.add}
              </Button>
            </Box>
          )}
        </Collapse>
      )}
      <ConfirmDialog
        open={deleting}
        title="Видалити заклад?"
        text={`«${institution.name}» буде видалено, якщо він не використовується.`}
        onConfirm={() => deleteInstitution(institution.id)}
        onClose={() => setDeleting(false)}
      />
    </Paper>
  )
}
