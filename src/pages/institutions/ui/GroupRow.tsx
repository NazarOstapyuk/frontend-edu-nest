import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import type { Child, Group } from '../../../shared/api'
import { useStructureStore } from '../model/structureStore'

interface GroupRowProps {
  group: Group
  childrenById: Map<string, Child>
  canEdit: boolean
  columns: number
}

const fullName = (c: { lastName: string; firstName: string; middleName: string | null }) =>
  [c.lastName, c.firstName, c.middleName].filter(Boolean).join(' ')

export const GroupRow = ({ group, childrenById, canEdit, columns }: GroupRowProps) => {
  const [open, setOpen] = useState(false)
  const setEditGroupModal = useStructureStore((s) => s.setEditGroupModal)
  const setCreateChildModal = useStructureStore((s) => s.setCreateChildModal)
  const setEditChildModal = useStructureStore((s) => s.setEditChildModal)
  const deleteGroup = useStructureStore((s) => s.deleteGroup)
  const deleteChild = useStructureStore((s) => s.deleteChild)
  const isDeleting = useStructureStore((s) => s.isDeleting)

  const children = [...(group.children ?? [])].sort((a, b) =>
    fullName(a).localeCompare(fullName(b), 'uk'),
  )

  return (
    <>
      <TableRow hover sx={{ '& > td': { borderBottom: open ? 0 : undefined } }}>
        <TableCell sx={{ width: 48, pr: 0 }}>
          <IconButton size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => setOpen((v) => !v)}>
          {group.name}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {group.teachers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">—</Typography>
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
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{children.length}</TableCell>
        {canEdit && (
          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
            <Tooltip title="Редагувати">
              <IconButton size="small" onClick={() => setEditGroupModal({ isOpen: true, group })}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Видалити">
              <IconButton
                size="small"
                color="error"
                disabled={isDeleting}
                onClick={() => deleteGroup(group.id).catch(() => undefined)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell colSpan={columns} sx={{ py: 0, ...(open ? {} : { borderBottom: 0 }) }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 6, pr: 1, py: 1.5 }}>
              {children.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
                  Дітей ще немає.
                </Typography>
              ) : (
                children.map((child, index) => {
                  const full = childrenById.get(child.id)
                  return (
                    <Box
                      key={child.id}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 34 }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ width: 24 }}>
                        {index + 1}
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {fullName(child)}
                      </Typography>
                      {canEdit && (
                        <>
                          <Tooltip title="Редагувати">
                            <span>
                              <IconButton
                                size="small"
                                disabled={!full}
                                onClick={() => full && setEditChildModal({ isOpen: true, child: full })}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Видалити">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={isDeleting}
                                onClick={() => deleteChild(child.id).catch(() => undefined)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  )
                })
              )}
              {canEdit && (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ mt: 1 }}
                  onClick={() => setCreateChildModal({ isOpen: true, groupId: group.id })}
                >
                  Додати дитину
                </Button>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
