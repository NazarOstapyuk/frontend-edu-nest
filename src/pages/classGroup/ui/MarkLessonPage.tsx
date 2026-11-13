import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { useMarkLessonStore } from '../model/markLessonStore'
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList } from '../../../shared/ui/CardList'
import { ReasonDialog } from '../../../shared/ui/ReasonDialog'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { InitialsAvatar } from '../../../shared/ui/InitialsAvatar'
import { brandColors } from '../../../shared/assets/brand'
import {
  attendanceStatusLabels,
  attendanceStatuses,
  formatDay,
  localToday,
  type AttendanceStatus,
  type Child,
  type RosterRow,
} from '../../../shared/api'
import { SellPackagesDialog, type SellCandidate } from './SellPackagesDialog'
import { ExtendPackageDialog, type ExtendTarget } from './ExtendPackageDialog'

type Block = NonNullable<RosterRow['packageBlock']>

const blockLabel = (block: Block) => {
  if (block.reason === 'expired') return `Пакет закінчився ${formatDay(block.date)}`
  if (block.reason === 'used_up') return 'Заняття в пакеті закінчились'
  if (block.reason === 'starts_later') return `Пакет діє лише з ${formatDay(block.date)}`
  return 'Немає пакета'
}

const childrenWord = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'дитина'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дитини'
  return 'дітей'
}

const shortName = (child: { firstName: string; lastName: string }) =>
  `${child.lastName.trim()} ${child.firstName.trim().charAt(0)}.`

export const MarkLessonPage = () => {
  const { groupId, date } = useParams<{ groupId: string; date: string }>()
  const navigate = useNavigate()
  const isAdmin = useCan('classes', 'edit')
  const roster = useMarkLessonStore((s) => s.roster)
  const storeKey = useMarkLessonStore((s) => s.key)
  const draft = useMarkLessonStore((s) => s.draft)
  const guests = useMarkLessonStore((s) => s.guests)
  const allChildren = useMarkLessonStore((s) => s.allChildren)
  const isSaving = useMarkLessonStore((s) => s.isSaving)
  const isFixing = useMarkLessonStore((s) => s.isFixing)
  const load = useMarkLessonStore((s) => s.load)
  const setStatus = useMarkLessonStore((s) => s.setStatus)
  const markPresent = useMarkLessonStore((s) => s.markPresent)
  const addGuest = useMarkLessonStore((s) => s.addGuest)
  const save = useMarkLessonStore((s) => s.save)
  const sellPackages = useMarkLessonStore((s) => s.sellPackages)
  const extendPackage = useMarkLessonStore((s) => s.extendPackage)
  const isPhone = useIsPhone()
  const [reasonOpen, setReasonOpen] = useState(false)
  const [guest, setGuest] = useState<Child | null>(null)
  const [unmarkedOpen, setUnmarkedOpen] = useState(false)
  const [sell, setSell] = useState<{ focusId: string | null } | null>(null)
  const [extend, setExtend] = useState<(ExtendTarget & { childId: string }) | null>(null)

  useEffect(() => {
    if (groupId && date) load(groupId, date, true).catch(() => undefined)
  }, [groupId, date, load])

  if (!roster || storeKey !== `${groupId}/${date}`) {
    return <Typography color="text.secondary">Завантаження…</Typography>
  }

  const lessonDate = date ?? ''
  const isLate = lessonDate < localToday()
  const hasCorrections = roster.rows.some((r) => r.attendance && draft[r.child.id] && draft[r.child.id] !== r.attendance.status)
  const rows: RosterRow[] = [
    ...roster.rows,
    ...guests.map((g) => ({
      child: { id: g.id, firstName: g.firstName, lastName: g.lastName },
      isMember: false,
      attendance: null,
      packageInfo: null,
      packageBlock: null,
    })),
  ]

  const tariff = roster.packageTariff ?? null
  const isBlocked = (row: RosterRow) => row.isMember && !row.packageInfo && !roster.hasSingleTariff && !row.attendance
  const blockOf = (row: RosterRow): Block | null =>
    isBlocked(row) ? (row.packageBlock ?? { reason: 'none', date: null, packageId: null }) : null
  const canExtend = (block: Block | null) => block?.reason === 'expired' && !!block.packageId && !!block.date
  const canFix = (row: RosterRow) => {
    const block = blockOf(row)
    return isAdmin && !!block && (canExtend(block) || !!tariff)
  }
  const missedRule = roster.group.direction.missedRule
  const statusDisabled = (row: RosterRow, status: AttendanceStatus) => {
    if (!isBlocked(row)) return false
    if (status === 'present') return !canFix(row)
    if (missedRule === 'always') return true
    return missedRule === 'unexcused_only' && status === 'absent_unexcused'
  }

  const blockedRows = rows.filter(isBlocked)
  const blockedCount = blockedRows.length
  const markable = rows.filter((r) => !isBlocked(r))
  const markedCount = markable.filter((r) => draft[r.child.id]).length
  const unmarkedCount = markable.length - markedCount
  const availableGuests = allChildren.filter(
    (c) => !roster.rows.some((r) => r.child.id === c.id) && !guests.some((g) => g.id === c.id),
  )

  const reasonGroups = blockedRows.reduce<{ label: string; names: string[] }[]>((groups, row) => {
    const label = blockLabel(blockOf(row)!)
    const existing = groups.find((g) => g.label === label)
    if (existing) existing.names.push(shortName(row.child))
    else groups.push({ label, names: [shortName(row.child)] })
    return groups
  }, [])

  const candidates = (focusId: string | null): SellCandidate[] =>
    blockedRows.map((row) => {
      const block = blockOf(row)!
      return {
        id: row.child.id,
        name: `${row.child.lastName.trim()} ${row.child.firstName.trim()}`,
        reason:
          block.reason === 'starts_later'
            ? `${blockLabel(block)}: новий пакет може бути зайвим`
            : blockLabel(block),
        preselected: focusId ? row.child.id === focusId : block.reason !== 'starts_later',
      }
    })

  const openFix = (row: RosterRow) => {
    const block = blockOf(row)
    if (!block) return
    if (canExtend(block)) {
      setExtend({
        childId: row.child.id,
        packageId: block.packageId!,
        childName: `${row.child.lastName.trim()} ${row.child.firstName.trim()}`,
        expiredOn: block.date!,
      })
      return
    }
    if (tariff) setSell({ focusId: row.child.id })
  }

  const onStatusChange = (row: RosterRow, value: AttendanceStatus | null) => {
    if (!value) return
    if (value === 'present' && isBlocked(row)) {
      openFix(row)
      return
    }
    setStatus(row.child.id, value)
  }

  const handleSave = (confirmed = false) => {
    if (!confirmed && unmarkedCount > 0) {
      setUnmarkedOpen(true)
      return
    }
    if (isAdmin && isLate && hasCorrections) {
      setReasonOpen(true)
      return
    }
    save().catch(() => undefined)
  }

  const reasonLine = (row: RosterRow) => {
    const block = blockOf(row)
    if (!block) return null
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: brandColors.debt, mt: 0.25 }}>
        <ErrorOutlineIcon sx={{ fontSize: 16 }} />
        <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 700 }}>
          {blockLabel(block)}
        </Typography>
      </Box>
    )
  }

  const packageCell = (row: RosterRow) => {
    if (row.packageInfo) {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Лишилось {row.packageInfo.remaining} з {row.packageInfo.total}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.packageInfo.expiresAt ? `діє до ${formatDay(row.packageInfo.expiresAt)}` : 'без терміну дії'}
          </Typography>
        </Box>
      )
    }
    if (!row.isMember) {
      return roster.hasSingleTariff ? (
        <Typography variant="body2" color="text.secondary">Разове заняття</Typography>
      ) : (
        <Typography variant="body2" color="warning.main">Без пакета збереження не пройде</Typography>
      )
    }
    if (roster.hasSingleTariff) {
      return <Typography variant="body2" color="text.secondary">Разове заняття за тарифом групи</Typography>
    }
    const block = blockOf(row)
    if (!block) return <Typography variant="body2" color="text.secondary">—</Typography>
    if (!isAdmin) {
      return <Typography variant="body2" color="text.secondary">Можна лише пропуск</Typography>
    }
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {canExtend(block) && (
          <Button size="small" variant="outlined" onClick={() => openFix(row)} disabled={isFixing}>
            Продовжити пакет
          </Button>
        )}
        {tariff && (
          <Button
            size="small"
            variant={canExtend(block) ? 'text' : 'outlined'}
            onClick={() => setSell({ focusId: row.child.id })}
            disabled={isFixing}
          >
            {canExtend(block) ? 'Продати новий' : 'Продати пакет'}
          </Button>
        )}
      </Box>
    )
  }

  const statusGroup = (row: RosterRow, vertical: boolean) => (
    <ToggleButtonGroup
      size={vertical ? 'medium' : 'small'}
      exclusive
      fullWidth={vertical}
      orientation={vertical ? 'vertical' : 'horizontal'}
      value={draft[row.child.id] ?? null}
      onChange={(_, value: AttendanceStatus | null) => onStatusChange(row, value)}
    >
      {attendanceStatuses.map((s) => (
        <ToggleButton
          key={s}
          value={s}
          disabled={statusDisabled(row, s)}
          sx={{
            minHeight: vertical ? 44 : undefined,
            ...(s === 'present' && isBlocked(row) && canFix(row)
              ? { borderStyle: 'dashed', color: 'text.secondary' }
              : {}),
          }}
        >
          {attendanceStatusLabels[s]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )

  const nameBlock = (row: RosterRow) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <InitialsAvatar id={row.child.id} firstName={row.child.firstName} lastName={row.child.lastName} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 700 }}>
            {row.child.lastName.trim()} {row.child.firstName.trim()}
          </Typography>
          {!row.isMember && <Chip size="small" label="Разово" />}
        </Box>
        {reasonLine(row)}
      </Box>
    </Box>
  )

  const fixPanel = blockedCount > 0 && (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '20px',
        boxShadow: brandColors.outline,
        p: { xs: 2, sm: 3 },
        mb: 2,
        display: 'flex',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: '14px',
          bgcolor: brandColors.orangeTint,
          color: brandColors.orangeText,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Inventory2OutlinedIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
          {blockedCount} {childrenWord(blockedCount)} без дійсного пакета на {formatDay(roster.date)}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 680 }}>
          Присутність списує заняття з пакета, тому без пакета поставити «Присутній» не можна. Пропуск можна поставити
          вже зараз.
        </Typography>
        <Box component="ul" sx={{ m: 0, mt: 1.5, pl: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
          {reasonGroups.map((g) => (
            <Box component="li" key={g.label} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: brandColors.debt }}>
                {g.label}:
              </Typography>
              <Typography variant="body2">{g.names.join(', ')}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin && tariff && (
            <Button
              variant="outlined"
              startIcon={<Inventory2OutlinedIcon />}
              onClick={() => setSell({ focusId: null })}
              disabled={isFixing}
              fullWidth={isPhone}
            >
              Продати пакет кільком дітям
            </Button>
          )}
          {isAdmin && !tariff && (
            <>
              <Typography variant="body2" sx={{ flexBasis: '100%' }}>
                У групі не задано тариф пакета, тому продати пакет звідси не вийде. Задайте його в налаштуваннях групи.
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/classes')} fullWidth={isPhone}>
                Відкрити гуртки
              </Button>
            </>
          )}
          {!isAdmin && (
            <Typography variant="body2">Попросіть адміністратора продати пакет цим дітям.</Typography>
          )}
        </Box>
      </Box>
    </Paper>
  )

  const progress = (
    <Typography variant="body2" color="text.secondary">
      Відмічено {markedCount} з {markable.length}
      {blockedCount > 0 ? `, ще ${blockedCount} чекають на пакет` : ''}
    </Typography>
  )

  return (
    <Box sx={{ pb: isPhone ? 10 : 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(`/classes/${roster.group.id}`)} aria-label="Назад до групи">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ mr: 'auto', minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{roster.group.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDay(roster.date)}
            {roster.conductedBy ? `, провів ${roster.conductedBy.lastName} ${roster.conductedBy.firstName}` : ''}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          disabled={isSaving || unmarkedCount === 0}
          onClick={() => markPresent(markable.map((r) => r.child.id))}
          sx={{ minHeight: { xs: 40, sm: 'unset' } }}
        >
          Усі присутні
        </Button>
        {!isPhone && (
          <Button variant="contained" disabled={isSaving} onClick={() => handleSave()}>
            Зберегти
          </Button>
        )}
      </Box>

      {fixPanel}

      <Box sx={{ mb: 1.5 }}>{progress}</Box>

      {isPhone ? (
        <Box sx={{ mb: 2 }}>
          <CardList
            items={rows}
            getKey={(r) => r.child.id}
            empty={<Typography color="text.secondary">У групі немає дітей на цю дату.</Typography>}
            renderCard={(row) => (
              <>
                <Box sx={{ mb: 1.5 }}>{nameBlock(row)}</Box>
                <Box sx={{ mb: 1.5 }}>{packageCell(row)}</Box>
                {statusGroup(row, true)}
              </>
            )}
          />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '20px', mb: 2, overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Дитина</TableCell>
                <TableCell>Пакет</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>У групі немає дітей на цю дату.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.child.id}
                    sx={isBlocked(row) ? { bgcolor: brandColors.hoverRow } : undefined}
                  >
                    <TableCell>{nameBlock(row)}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{packageCell(row)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{statusGroup(row, false)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Autocomplete
          sx={{ minWidth: { xs: 0, sm: 320 }, width: { xs: '100%', sm: 'auto' } }}
          options={availableGuests}
          getOptionLabel={(c) => `${c.lastName} ${c.firstName}`}
          value={guest}
          onChange={(_, selected) => setGuest(selected)}
          renderInput={(params) => <TextField {...params} size="small" label="Разовий учасник" />}
        />
        <Button
          disabled={!guest}
          onClick={() => {
            if (guest) addGuest(guest)
            setGuest(null)
          }}
        >
          Додати
        </Button>
      </Box>

      {isPhone && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            px: 2,
            py: 1.5,
            bgcolor: 'background.default',
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>{progress}</Box>
          <Button variant="contained" disabled={isSaving} onClick={() => handleSave()}>
            Зберегти
          </Button>
        </Box>
      )}

      {tariff && (
        <SellPackagesDialog
          open={!!sell}
          candidates={sell ? candidates(sell.focusId) : []}
          tariff={tariff}
          lessonDate={lessonDate}
          isSaving={isFixing}
          onClose={() => setSell(null)}
          onSubmit={async (childIds, purchaseDate, expiresAt) => {
            await sellPackages(childIds, purchaseDate, expiresAt)
            if (sell?.focusId && childIds.includes(sell.focusId) && purchaseDate <= lessonDate) {
              setStatus(sell.focusId, 'present')
            }
          }}
        />
      )}

      <ExtendPackageDialog
        target={extend}
        lessonDate={lessonDate}
        isSaving={isFixing}
        onClose={() => setExtend(null)}
        onSubmit={async (packageId, newExpiresAt, reason) => {
          await extendPackage(packageId, newExpiresAt, reason)
          if (extend) setStatus(extend.childId, 'present')
        }}
      />

      <ConfirmDialog
        open={unmarkedOpen}
        title="Є діти без відмітки"
        text={`Без відмітки: ${unmarkedCount}. Для них не буде створено запис відвідування і не спишеться заняття.`}
        confirmLabel="Зберегти так"
        cancelLabel="Повернутися"
        color="primary"
        onConfirm={() => handleSave(true)}
        onClose={() => setUnmarkedOpen(false)}
      />

      <ReasonDialog
        open={reasonOpen}
        title="Виправлення відмітки"
        subtitle="Заняття вже минуло. Вкажіть причину виправлення."
        confirmLabel="Зберегти"
        isSaving={isSaving}
        onClose={() => setReasonOpen(false)}
        onSubmit={(reason) => save(reason)}
      />
    </Box>
  )
}
