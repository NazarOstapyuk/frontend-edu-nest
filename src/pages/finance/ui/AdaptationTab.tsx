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
import BlockIcon from '@mui/icons-material/Block'
import { useAdaptationStore } from '../model/adaptationStore'
import { useCan } from '../../../entities/user'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { chargeStateLabels, formatMoney } from '../../../shared/api'
import { CreateAdaptationVisitModal } from './CreateAdaptationVisitModal'

const formatDate = (value: string) => new Date(value).toLocaleDateString('uk-UA', { timeZone: 'UTC' })
const voidedSx = { '& td': { color: 'text.disabled', textDecoration: 'line-through' } }

interface AdaptationTabProps {
  childId: string
}

export const AdaptationTab = ({ childId }: AdaptationTabProps) => {
  const visits = useAdaptationStore((s) => s.visits)
  const storeChildId = useAdaptationStore((s) => s.childId)
  const fetchVisits = useAdaptationStore((s) => s.fetchVisits)
  const setCreateVisitModal = useAdaptationStore((s) => s.setCreateVisitModal)
  const voidTarget = useAdaptationStore((s) => s.voidTarget)
  const setVoidTarget = useAdaptationStore((s) => s.setVoidTarget)
  const voidVisit = useAdaptationStore((s) => s.voidVisit)
  const isSaving = useAdaptationStore((s) => s.isSaving)
  const canEdit = useCan('tariffs', 'edit')
  const isPhone = useIsPhone()

  useEffect(() => {
    fetchVisits(childId)
  }, [childId, fetchVisits])

  const rows = storeChildId === childId ? visits : []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 2, '& .MuiButton-root': { flexGrow: { xs: 1, sm: 0 } } }}>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateVisitModal({ isOpen: true })}>
            Додати відвідування
          </Button>
        )}
      </Box>
      {isPhone ? (
        <CardList
          items={rows}
          getKey={(v) => v.id}
          empty={
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              Відвідувань адаптації ще немає.
            </Typography>
          }
          renderCard={(v) => (
            <Box sx={v.voidedAt ? { color: 'text.disabled' } : undefined}>
              <Typography sx={{ fontWeight: 600, mb: 0.5, textDecoration: v.voidedAt ? 'line-through' : undefined }}>
                {formatDate(v.date)} · {v.tariff.name}
              </Typography>
              <CardField label="Годин">{Number(v.hours)}</CardField>
              <CardField label="Ставка">{formatMoney(v.ratePerHour)}</CardField>
              <CardField label="Сума">{formatMoney(v.amount)}</CardField>
              <CardField label="Оплата">{v.chargeState ? chargeStateLabels[v.chargeState] : '—'}</CardField>
              <CardField label="Примітка">{v.note ?? '—'}</CardField>
              {v.voidedAt && <CardField label="Причина сторно">{v.voidReason ?? '—'}</CardField>}
              {canEdit && !v.voidedAt && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
                  <Tooltip title="Сторнувати">
                    <IconButton size="small" color="error" onClick={() => setVoidTarget(v)}>
                      <BlockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}
        />
      ) : (
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Дата</TableCell>
              <TableCell>Тариф</TableCell>
              <TableCell align="right">Годин</TableCell>
              <TableCell align="right">Ставка</TableCell>
              <TableCell align="right">Сума</TableCell>
              <TableCell>Оплата</TableCell>
              <TableCell>Примітка</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Відвідувань адаптації ще немає.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((v) => (
                <TableRow key={v.id} sx={v.voidedAt ? voidedSx : undefined}>
                  <TableCell>{formatDate(v.date)}</TableCell>
                  <TableCell>{v.tariff.name}</TableCell>
                  <TableCell align="right">{Number(v.hours)}</TableCell>
                  <TableCell align="right">{formatMoney(v.ratePerHour)}</TableCell>
                  <TableCell align="right">{formatMoney(v.amount)}</TableCell>
                  <TableCell>{v.chargeState ? chargeStateLabels[v.chargeState] : '—'}</TableCell>
                  <TableCell>
                    {v.voidedAt ? (
                      <Tooltip title={`Причина сторно: ${v.voidReason ?? ''}`}>
                        <Typography variant="body2" component="span">{v.note ?? '—'}</Typography>
                      </Tooltip>
                    ) : (
                      v.note ?? '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {canEdit && !v.voidedAt && (
                      <Tooltip title="Сторнувати">
                        <IconButton size="small" color="error" onClick={() => setVoidTarget(v)}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <CreateAdaptationVisitModal />
      <ReasonDialog
        open={voidTarget !== null}
        title="Сторнувати відвідування"
        subtitle={
          voidTarget
            ? `${formatDate(voidTarget.date)}, ${Number(voidTarget.hours)} год. Нарахування теж буде сторновано.`
            : undefined
        }
        isSaving={isSaving}
        onClose={() => setVoidTarget(null)}
        onSubmit={voidVisit}
      />
    </Box>
  )
}
