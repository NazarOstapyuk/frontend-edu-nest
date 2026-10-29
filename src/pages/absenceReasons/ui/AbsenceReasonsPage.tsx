import { useEffect } from 'react'
import { Box, Button, IconButton, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useAbsenceReasonsStore } from '../model/absenceReasonsStore'
import { useCan } from '../../../entities/user'
import { AbsenceReasonModal } from './AbsenceReasonModal'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'

export const AbsenceReasonsPage = () => {
  const reasons = useAbsenceReasonsStore((s) => s.reasons)
  const fetchReasons = useAbsenceReasonsStore((s) => s.fetchReasons)
  const updateReason = useAbsenceReasonsStore((s) => s.updateReason)
  const setModal = useAbsenceReasonsStore((s) => s.setModal)
  const canEdit = useCan('register', 'edit')
  const isPhone = useIsPhone()

  useEffect(() => {
    fetchReasons().catch(() => undefined)
  }, [fetchReasons])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">Всього причин: {reasons.length}</Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModal({ isOpen: true, reason: null })}>
            Додати причину
          </Button>
        )}
      </Box>
      {isPhone ? (
        <CardList
          items={reasons}
          getKey={(r) => r.id}
          empty={<Typography color="text.secondary" align="center" sx={{ py: 6 }}>Причин ще немає.</Typography>}
          renderCard={(reason) => (
            <Box sx={{ opacity: reason.active ? 1 : 0.5 }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{reason.name}</Typography>
              <CardField label="Поважна">{reason.excused ? 'Так' : 'Ні'}</CardField>
              <CardField label="Потрібна довідка">{reason.requiresDocument ? 'Так' : 'Ні'}</CardField>
              <CardField label="Порядок">{reason.sortOrder}</CardField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Активна</Typography>
                <Switch
                  checked={reason.active}
                  disabled={!canEdit}
                  onChange={(e) => updateReason(reason.id, { active: e.target.checked }).catch(() => undefined)}
                />
                {canEdit && (
                  <IconButton size="small" onClick={() => setModal({ isOpen: true, reason })}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}
        />
      ) : (
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Назва</TableCell>
              <TableCell>Поважна</TableCell>
              <TableCell>Потрібна довідка</TableCell>
              <TableCell>Порядок</TableCell>
              <TableCell>Активна</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {reasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ color: 'text.secondary' }}>Причин ще немає.</TableCell>
              </TableRow>
            ) : (
              reasons.map((reason) => (
                <TableRow key={reason.id} sx={{ opacity: reason.active ? 1 : 0.5 }}>
                  <TableCell>{reason.name}</TableCell>
                  <TableCell>{reason.excused ? 'Так' : 'Ні'}</TableCell>
                  <TableCell>{reason.requiresDocument ? 'Так' : 'Ні'}</TableCell>
                  <TableCell>{reason.sortOrder}</TableCell>
                  <TableCell>
                    <Switch
                      checked={reason.active}
                      disabled={!canEdit}
                      onChange={(e) => updateReason(reason.id, { active: e.target.checked }).catch(() => undefined)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {canEdit && (
                      <IconButton size="small" onClick={() => setModal({ isOpen: true, reason })}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      )}
      <AbsenceReasonModal />
    </Box>
  )
}
