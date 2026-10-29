import { Fragment, useEffect, useState } from 'react'
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
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { usePackagesStore } from '../model/packagesStore'
import { useCan } from '../../../entities/user'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import {
  attendanceStatusLabels,
  formatDay,
  packageStateLabels,
  type ChildPackage,
  type PackageState,
} from '../../../shared/api'
import { BuyPackageModal } from './BuyPackageModal'
import { ExtendPackageModal } from './ExtendPackageModal'
import { ReconcileModal } from './ReconcileModal'

const stateColors: Record<PackageState, 'success' | 'default' | 'warning' | 'error'> = {
  active: 'success',
  exhausted: 'default',
  expired: 'warning',
  voided: 'default',
  needs_reconciliation: 'error',
}

const PackageRow = ({ pkg }: { pkg: ChildPackage }) => {
  const [open, setOpen] = useState(false)
  const setExtendTarget = usePackagesStore((s) => s.setExtendTarget)
  const setReconcileTarget = usePackagesStore((s) => s.setReconcileTarget)
  const setVoidTarget = usePackagesStore((s) => s.setVoidTarget)
  const canEdit = useCan('classes', 'edit')
  const voided = pkg.state === 'voided'

  return (
    <Fragment>
      <TableRow sx={voided ? { '& td': { color: 'text.disabled', textDecoration: 'line-through' } } : undefined}>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" aria-label="Деталі пакета" onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{pkg.direction.name}</TableCell>
        <TableCell>{pkg.tariff?.name ?? 'Перенесений абонемент'}</TableCell>
        <TableCell align="right">{pkg.used} / {pkg.sessionsTotal}</TableCell>
        <TableCell align="right">{pkg.remaining}</TableCell>
        <TableCell>{formatDay(pkg.purchaseDate)}</TableCell>
        <TableCell>{pkg.expiresAt ? formatDay(pkg.expiresAt) : '—'}</TableCell>
        <TableCell>
          <Chip size="small" variant="outlined" color={stateColors[pkg.state]} label={packageStateLabels[pkg.state]} />
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {canEdit && pkg.needsReconciliation && !voided && (
            <Button size="small" color="error" onClick={() => setReconcileTarget(pkg)}>
              Звірити
            </Button>
          )}
          {canEdit && !voided && pkg.expiresAt !== null && (
            <Button size="small" onClick={() => setExtendTarget(pkg)}>
              Продовжити
            </Button>
          )}
          {canEdit && !voided && pkg.used === 0 && !pkg.needsReconciliation && (
            <Button size="small" color="error" onClick={() => setVoidTarget(pkg)}>
              Сторнувати
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {pkg.voidReason && <Typography variant="body2">Причина сторно: {pkg.voidReason}</Typography>}
              {pkg.reconciliationNote && <Typography variant="body2">Звірка: {pkg.reconciliationNote}</Typography>}
              {pkg.extensions.map((e) => (
                <Typography key={e.id} variant="body2" color="text.secondary">
                  Продовжено до {formatDay(e.newExpiresAt)}: {e.reason}
                </Typography>
              ))}
              {pkg.usages.length === 0 && pkg.legacyAttendances.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Списань ще не було.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Дата</TableCell>
                      <TableCell>Група</TableCell>
                      <TableCell>Статус</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pkg.usages.map((u) => (
                      <TableRow key={u.id} sx={u.voidedAt ? { '& td': { color: 'text.disabled', textDecoration: 'line-through' } } : undefined}>
                        <TableCell>{formatDay(u.date)}</TableCell>
                        <TableCell>{u.groupName}</TableCell>
                        <TableCell>{attendanceStatusLabels[u.status]}</TableCell>
                      </TableRow>
                    ))}
                    {pkg.legacyAttendances.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDay(a.date)}</TableCell>
                        <TableCell>Старий абонемент</TableCell>
                        <TableCell>{a.note ?? 'Відвідування'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}

const PackageCard = ({ pkg }: { pkg: ChildPackage }) => {
  const [open, setOpen] = useState(false)
  const setExtendTarget = usePackagesStore((s) => s.setExtendTarget)
  const setReconcileTarget = usePackagesStore((s) => s.setReconcileTarget)
  const setVoidTarget = usePackagesStore((s) => s.setVoidTarget)
  const canEdit = useCan('classes', 'edit')
  const voided = pkg.state === 'voided'

  return (
    <Box sx={voided ? { color: 'text.disabled' } : undefined}>
      <Typography sx={{ fontWeight: 600, mb: 0.5, textDecoration: voided ? 'line-through' : undefined }}>
        {pkg.direction.name}
      </Typography>
      <Box sx={{ mb: 0.5 }}>
        <Chip size="small" variant="outlined" color={stateColors[pkg.state]} label={packageStateLabels[pkg.state]} />
      </Box>
      <CardField label="Тариф">{pkg.tariff?.name ?? 'Перенесений абонемент'}</CardField>
      <CardField label="Використано">
        {pkg.used} / {pkg.sessionsTotal}
      </CardField>
      <CardField label="Залишок">{pkg.remaining}</CardField>
      <CardField label="Куплено">{formatDay(pkg.purchaseDate)}</CardField>
      <CardField label="Діє до">{pkg.expiresAt ? formatDay(pkg.expiresAt) : '—'}</CardField>
      {pkg.voidReason && <CardField label="Причина сторно">{pkg.voidReason}</CardField>}
      {pkg.reconciliationNote && <CardField label="Звірка">{pkg.reconciliationNote}</CardField>}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {pkg.extensions.map((e) => (
            <Typography key={e.id} variant="body2" color="text.secondary">
              Продовжено до {formatDay(e.newExpiresAt)}: {e.reason}
            </Typography>
          ))}
          {pkg.usages.length === 0 && pkg.legacyAttendances.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Списань ще не було.
            </Typography>
          ) : (
            <>
              {pkg.usages.map((u) => (
                <Typography
                  key={u.id}
                  variant="body2"
                  sx={u.voidedAt ? { color: 'text.disabled', textDecoration: 'line-through' } : undefined}
                >
                  {formatDay(u.date)} · {u.groupName} · {attendanceStatusLabels[u.status]}
                </Typography>
              ))}
              {pkg.legacyAttendances.map((a) => (
                <Typography key={a.id} variant="body2">
                  {formatDay(a.date)} · Старий абонемент · {a.note ?? 'Відвідування'}
                </Typography>
              ))}
            </>
          )}
        </Box>
      </Collapse>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        <IconButton size="small" aria-label="Деталі пакета" onClick={() => setOpen(!open)}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
        {canEdit && pkg.needsReconciliation && !voided && (
          <Button size="small" color="error" onClick={() => setReconcileTarget(pkg)}>
            Звірити
          </Button>
        )}
        {canEdit && !voided && pkg.expiresAt !== null && (
          <Button size="small" onClick={() => setExtendTarget(pkg)}>
            Продовжити
          </Button>
        )}
        {canEdit && !voided && pkg.used === 0 && !pkg.needsReconciliation && (
          <Button size="small" color="error" onClick={() => setVoidTarget(pkg)}>
            Сторнувати
          </Button>
        )}
      </Box>
    </Box>
  )
}

interface PackagesTabProps {
  childId: string
}

export const PackagesTab = ({ childId }: PackagesTabProps) => {
  const packages = usePackagesStore((s) => s.packages)
  const storeChildId = usePackagesStore((s) => s.childId)
  const fetchPackages = usePackagesStore((s) => s.fetchPackages)
  const setBuyOpen = usePackagesStore((s) => s.setBuyOpen)
  const voidTarget = usePackagesStore((s) => s.voidTarget)
  const setVoidTarget = usePackagesStore((s) => s.setVoidTarget)
  const voidPackage = usePackagesStore((s) => s.voidPackage)
  const isSaving = usePackagesStore((s) => s.isSaving)
  const canEdit = useCan('classes', 'edit')
  const isPhone = useIsPhone()

  useEffect(() => {
    fetchPackages(childId).catch(() => undefined)
  }, [childId, fetchPackages])

  const rows = storeChildId === childId ? packages : []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mb: 2, '& .MuiButton-root': { flexGrow: { xs: 1, sm: 0 } } }}>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBuyOpen(true)}>
            Купити пакет
          </Button>
        )}
      </Box>
      {isPhone ? (
        <CardList
          items={rows}
          getKey={(p) => p.id}
          empty={
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              Пакетів ще немає.
            </Typography>
          }
          renderCard={(p) => <PackageCard pkg={p} />}
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
              <TableCell />
              <TableCell>Напрям</TableCell>
              <TableCell>Тариф</TableCell>
              <TableCell align="right">Використано</TableCell>
              <TableCell align="right">Залишок</TableCell>
              <TableCell>Куплено</TableCell>
              <TableCell>Діє до</TableCell>
              <TableCell>Стан</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Пакетів ще немає.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => <PackageRow key={p.id} pkg={p} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <BuyPackageModal />
      <ExtendPackageModal />
      <ReconcileModal />
      <ReasonDialog
        open={voidTarget !== null}
        title="Сторнувати пакет"
        subtitle="Пакет і його нарахування буде сторновано."
        isSaving={isSaving}
        onClose={() => setVoidTarget(null)}
        onSubmit={voidPackage}
      />
    </Box>
  )
}
