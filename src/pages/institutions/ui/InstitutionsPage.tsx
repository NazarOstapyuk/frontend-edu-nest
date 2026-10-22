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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { useInstitutionsStore } from '../model/institutionsStore'
import { institutionTypeLabels } from '../../../shared/api'
import { useAuthStore, useCan } from '../../../entities/user'
import { CreateInstitutionModal } from './CreateInstitutionModal'
import { EditInstitutionModal } from './EditInstitutionModal'

export const InstitutionsPage = () => {
  const institutions = useInstitutionsStore((s) => s.institutions)
  const fetchInstitutions = useInstitutionsStore((s) => s.fetchInstitutions)
  const setCreateInstitutionModal = useInstitutionsStore((s) => s.setCreateInstitutionModal)
  const setEditInstitutionModal = useInstitutionsStore((s) => s.setEditInstitutionModal)
  const deleteInstitution = useInstitutionsStore((s) => s.deleteInstitution)
  const isDeleting = useInstitutionsStore((s) => s.isDeleting)
  const canEditSettings = useCan('settings', 'edit')
  const isFullScope = useAuthStore((s) => s.profile?.role === 'root' || s.profile?.accessScope === 'all')
  const canEdit = canEditSettings && isFullScope

  useEffect(() => {
    fetchInstitutions()
  }, [fetchInstitutions])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього закладів: {institutions.length}
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

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>#</TableCell>
              <TableCell>Назва</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Статус</TableCell>
              {canEdit && <TableCell align="right">Дії</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {institutions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Закладів ще немає.
                </TableCell>
              </TableRow>
            ) : (
              institutions.map((institution, index) => (
                <TableRow key={institution.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{institution.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {institutionTypeLabels[institution.type]}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={institution.isActive ? 'Активний' : 'Неактивний'}
                      size="small"
                      color={institution.isActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
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
                          onClick={() => deleteInstitution(institution.id).catch(() => undefined)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateInstitutionModal />
      <EditInstitutionModal />
    </Box>
  )
}
