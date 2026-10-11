import { useEffect } from 'react'
import {
  Autocomplete,
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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BlockIcon from '@mui/icons-material/Block'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EventNoteIcon from '@mui/icons-material/EventNote'
import { useSubscriptionsStore } from '../model/subscriptionsStore'
import { useAttendancesStore } from '../model/attendancesStore'
import { useChildrenStore } from '../../children/model/childrenStore'
import { useSubscriptionTypesStore } from '../../subscriptionTypes/model/subscriptionTypesStore'
import { subscriptionStatusLabels, type SubscriptionStatus } from '../../../shared/api'
import { CreateSubscriptionModal } from './CreateSubscriptionModal'
import { EditSubscriptionModal } from './EditSubscriptionModal'
import { AttendancesModal } from './AttendancesModal'

const statusColors: Record<SubscriptionStatus, 'success' | 'default' | 'warning'> = {
  active: 'success',
  cancelled: 'default',
  finished: 'warning',
}

const ALL_STATUSES = '' as const

export const SubscriptionsPage = () => {
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions)
  const filters = useSubscriptionsStore((s) => s.filters)
  const fetchSubscriptions = useSubscriptionsStore((s) => s.fetchSubscriptions)
  const setFilters = useSubscriptionsStore((s) => s.setFilters)
  const setCreateModal = useSubscriptionsStore((s) => s.setCreateModal)
  const setEditModal = useSubscriptionsStore((s) => s.setEditModal)
  const openAttendances = useAttendancesStore((s) => s.open)
  const cancelSubscription = useSubscriptionsStore((s) => s.cancelSubscription)
  const deleteSubscription = useSubscriptionsStore((s) => s.deleteSubscription)
  const isCancelling = useSubscriptionsStore((s) => s.isCancelling)
  const isDeleting = useSubscriptionsStore((s) => s.isDeleting)

  const children = useChildrenStore((s) => s.children)
  const fetchChildren = useChildrenStore((s) => s.fetchChildren)
  const fetchSubscriptionTypes = useSubscriptionTypesStore((s) => s.fetchSubscriptionTypes)

  useEffect(() => {
    fetchChildren()
    fetchSubscriptionTypes()
  }, [fetchChildren, fetchSubscriptionTypes])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions, filters])

  const handleChildFilter = (_: unknown, selected: { id: string } | null) => {
    setFilters({ ...filters, childId: selected?.id ?? undefined })
  }

  const handleStatusFilter = (value: string) => {
    setFilters({ ...filters, status: value ? (value as SubscriptionStatus) : undefined })
  }

  const formatPrice = (value: number) =>
    value.toLocaleString('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 0 }}>
          <Autocomplete
            sx={{ minWidth: 240 }}
            options={children}
            getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
            value={children.find((c) => c.id === filters.childId) ?? null}
            onChange={handleChildFilter}
            renderInput={(params) => <TextField {...params} label="Учень" size="small" />}
          />

          <TextField
            select
            size="small"
            label="Статус"
            sx={{ minWidth: 160 }}
            value={filters.status ?? ALL_STATUSES}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <MenuItem value="">Всі</MenuItem>
            {(Object.keys(subscriptionStatusLabels) as SubscriptionStatus[]).map((key) => (
              <MenuItem key={key} value={key}>{subscriptionStatusLabels[key]}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModal({ isOpen: true })}
        >
          Створити абонемент
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
              <TableCell>Учень</TableCell>
              <TableCell>Тип абонементу</TableCell>
              <TableCell align="center">Залишилось</TableCell>
              <TableCell>Ціна / заняття</TableCell>
              <TableCell>Загальна ціна</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Абонементів ще немає. Натисніть «Створити абонемент».
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub, index) => (
                <TableRow key={sub.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {sub.child.lastName} {sub.child.firstName}
                  </TableCell>
                  <TableCell>{sub.subscriptionType.name}</TableCell>
                  <TableCell align="center" sx={{ color: 'text.secondary' }}>
                    {sub.remainingSessions} / {sub.totalSessions}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {formatPrice(sub.pricePerSession)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {formatPrice(sub.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={subscriptionStatusLabels[sub.status]}
                      size="small"
                      color={statusColors[sub.status]}
                      variant={sub.status === 'active' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Відвідування">
                      <IconButton size="small" color="primary" onClick={() => openAttendances(sub)}>
                        <EventNoteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Редагувати">
                      <IconButton
                        size="small"
                        onClick={() => setEditModal({ isOpen: true, subscription: sub })}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {sub.status === 'active' && (
                      <Tooltip title="Скасувати абонемент">
                        <IconButton
                          size="small"
                          color="warning"
                          disabled={isCancelling}
                          onClick={() => cancelSubscription(sub.id)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Видалити">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isDeleting}
                        onClick={() => deleteSubscription(sub.id)}
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

      <CreateSubscriptionModal />
      <EditSubscriptionModal />
      <AttendancesModal />
    </Box>
  )
}
