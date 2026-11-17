import { useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { formatMoney, type CashDeskState } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'
import { useCashStore } from '../model/cashStore'
import { DeskModal } from './DeskModal'

export const DesksSettingsTab = () => {
  const isPhone = useIsPhone()
  const desks = useCashStore((s) => s.settingsDesks)
  const isLoaded = useCashStore((s) => s.isSettingsLoaded)
  const isLoading = useCashStore((s) => s.isSettingsLoading)
  const isUpdating = useCashStore((s) => s.isUpdating)
  const fetchSettingsDesks = useCashStore((s) => s.fetchSettingsDesks)
  const updateDesk = useCashStore((s) => s.updateDesk)
  const setDeskModal = useCashStore((s) => s.setDeskModal)

  useEffect(() => {
    fetchSettingsDesks().catch(() => undefined)
  }, [fetchSettingsDesks])

  const toggle = (desk: CashDeskState) => {
    updateDesk(desk.id, { isActive: !desk.isActive }).catch(() => undefined)
  }

  const edit = (desk: CashDeskState) => setDeskModal({ isOpen: true, desk })

  const activeSwitch = (desk: CashDeskState) => (
    <Switch
      checked={desk.isActive}
      disabled={isUpdating}
      onChange={() => toggle(desk)}
      slotProps={{ input: { 'aria-label': `Каса активна: ${desk.name}` } }}
    />
  )

  if (!isLoaded) {
    if (isLoading) return <Skeleton variant="rounded" height={240} sx={{ borderRadius: '20px' }} />
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => fetchSettingsDesks().catch(() => undefined)}>
            Спробувати ще
          </Button>
        }
      >
        Не вдалося завантажити каси.
      </Alert>
    )
  }

  const empty = 'Кас ще немає'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography color="text.secondary">Кас: {desks.length}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDeskModal({ isOpen: true, desk: null })}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Додати касу
        </Button>
      </Box>

      {isPhone ? (
        <CardList
          items={desks}
          getKey={(desk) => desk.id}
          empty={<Typography color="text.secondary">{empty}</Typography>}
          renderCard={(desk) => (
            <>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>{desk.name}</Typography>
              <CardField label="Велика сума">{formatMoney(desk.largeAmount)}</CardField>
              <CardField label="Закрити до">{desk.closeBy}</CardField>
              <CardField label="Активна">{activeSwitch(desk)}</CardField>
              <Button size="small" color="inherit" onClick={() => edit(desk)} sx={{ mt: 1 }}>
                Редагувати
              </Button>
            </>
          )}
        />
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'nowrap' } }}>
                <TableCell>Назва</TableCell>
                <TableCell align="right">Велика сума</TableCell>
                <TableCell>Закрити до</TableCell>
                <TableCell>Активна</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {desks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                    {empty}
                  </TableCell>
                </TableRow>
              ) : (
                desks.map((desk) => (
                  <TableRow key={desk.id}>
                    <TableCell sx={{ fontWeight: 700 }}>{desk.name}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatMoney(desk.largeAmount)}</TableCell>
                    <TableCell>{desk.closeBy}</TableCell>
                    <TableCell>{activeSwitch(desk)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="inherit" onClick={() => edit(desk)}>
                        Редагувати
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
      <DeskModal />
    </Box>
  )
}
