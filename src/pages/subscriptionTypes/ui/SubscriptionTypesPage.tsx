import { useEffect } from 'react'
import {
  Box,
  Button,
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
import { useSubscriptionTypesStore } from '../model/subscriptionTypesStore'
import { CreateSubscriptionTypeModal } from './CreateSubscriptionTypeModal'
import { EditSubscriptionTypeModal } from './EditSubscriptionTypeModal'

export const SubscriptionTypesPage = () => {
  const subscriptionTypes = useSubscriptionTypesStore((s) => s.subscriptionTypes)
  const fetchSubscriptionTypes = useSubscriptionTypesStore((s) => s.fetchSubscriptionTypes)
  const setCreateModal = useSubscriptionTypesStore((s) => s.setCreateModal)
  const setEditModal = useSubscriptionTypesStore((s) => s.setEditModal)
  const deleteSubscriptionType = useSubscriptionTypesStore((s) => s.deleteSubscriptionType)

  useEffect(() => {
    fetchSubscriptionTypes()
  }, [fetchSubscriptionTypes])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього типів: {subscriptionTypes.length}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModal({ isOpen: true })}
        >
          Створити тип
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
              <TableCell>Назва</TableCell>
              <TableCell>Ціна за заняття</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subscriptionTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Типів абонементів ще немає. Натисніть «Створити тип».
                </TableCell>
              </TableRow>
            ) : (
              subscriptionTypes.map((item, index) => (
                <TableRow key={item.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {item.pricePerSession.toLocaleString('uk-UA', {
                      style: 'currency',
                      currency: 'UAH',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Редагувати">
                      <IconButton
                        size="small"
                        onClick={() => setEditModal({ isOpen: true, subscriptionType: item })}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteSubscriptionType(item.id)}
                      >
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

      <CreateSubscriptionTypeModal />
      <EditSubscriptionTypeModal />
    </Box>
  )
}
