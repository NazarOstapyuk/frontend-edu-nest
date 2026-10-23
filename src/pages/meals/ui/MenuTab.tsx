import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Skeleton, TextField, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined'
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined'
import { useMealsStore } from '../model/mealsStore'
import { MenuDayDialog } from './MenuDayDialog'
import { CopyMenuDialog } from './CopyMenuDialog'
import { ApplyTemplateDialog } from './ApplyTemplateDialog'
import { MenuPeriodDialog } from './MenuPeriodDialog'
import { MenuDayCard } from './MenuDayCard'
import { WeekRibbon } from './WeekRibbon'
import { dayState, longDate } from '../model/menuDay'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'
import { useCan } from '../../../entities/user'
import { addDaysIso, localToday, weekStart, type MenuDayView } from '../../../shared/api'

const columnsFor = (week: MenuDayView[]) =>
  week.map((day) => (dayState(day) === 'off' && !day.menu ? '56px' : 'minmax(180px, 1fr)')).join(' ')

export const MenuTab = () => {
  const canEdit = useCan('meals', 'edit')
  const institutionId = useMealsStore((s) => s.menuInstitutionId)
  const allInstitutions = useInstitutionStore((s) => s.institutions)
  const institutions = useEffectiveInstitutions()
  const isLoadingInstitutions = useInstitutionStore((s) => s.isLoading)
  const selectedId = useInstitutionStore((s) => s.selectedId)
  const loadInstitutions = useInstitutionStore((s) => s.load)
  const complexes = useMealsStore((s) => s.complexes)
  const start = useMealsStore((s) => s.menuStart)
  const weeks = useMealsStore((s) => s.menuWeeks)
  const key = useMealsStore((s) => s.menuKey)
  const days = useMealsStore((s) => s.menuDays)
  const failed = useMealsStore((s) => s.menuFailed)
  const loadMenu = useMealsStore((s) => s.loadMenu)
  const [editing, setEditing] = useState<MenuDayView | null>(null)
  const [dialog, setDialog] = useState<'copy' | 'apply' | 'publish' | 'unpublish' | null>(null)
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null)
  const initialId = selectedId ?? institutions.find((i) => i.isActive)?.id ?? ''
  const ready = key === `${institutionId}/${start}/${weeks}` && days.length > 0
  const today = localToday()
  const thisWeek = weekStart(today)
  const compact = weeks === 4

  useEffect(() => {
    if (allInstitutions.length === 0) loadInstitutions().catch(() => undefined)
  }, [allInstitutions.length, loadInstitutions])

  useEffect(() => {
    loadMenu({ institutionId: initialId }).catch(() => undefined)
  }, [loadMenu, initialId])

  const rows = Array.from({ length: weeks }, (_, w) => days.slice(w * 7, w * 7 + 7))
  const go = (patch: Parameters<typeof loadMenu>[0]) => loadMenu(patch).catch(() => undefined)
  const openDialog = (value: typeof dialog) => {
    setMoreAnchor(null)
    setDialog(value)
  }

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', p: 1.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
      >
        <TextField
          select
          size="small"
          label="Заклад"
          value={institutionId}
          onChange={(e) => go({ institutionId: e.target.value })}
          sx={{ minWidth: 200 }}
        >
          {institutions.map((i) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
        </TextField>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Попередній період">
            <IconButton size="small" onClick={() => go({ start: addDaysIso(start, -7 * weeks) })}><ChevronLeftIcon /></IconButton>
          </Tooltip>
          <Typography sx={{ fontWeight: 600, minWidth: { sm: 230 }, textAlign: 'center' }}>
            {longDate(start)} – {longDate(addDaysIso(start, weeks * 7 - 1))}
          </Typography>
          <Tooltip title="Наступний період">
            <IconButton size="small" onClick={() => go({ start: addDaysIso(start, 7 * weeks) })}><ChevronRightIcon /></IconButton>
          </Tooltip>
          <Button size="small" disabled={start === thisWeek} onClick={() => go({ start: thisWeek })}>Цей тиждень</Button>
        </Box>

        <ToggleButtonGroup size="small" exclusive value={weeks} onChange={(_, v: 1 | 4 | null) => v && go({ weeks: v })}>
          <ToggleButton value={1}>Тиждень</ToggleButton>
          <ToggleButton value={4}>4 тижні</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1 }} />

        {canEdit && (
          <>
            <Tooltip title="Інші дії">
              <IconButton onClick={(e) => setMoreAnchor(e.currentTarget)} aria-label="Інші дії"><MoreHorizIcon /></IconButton>
            </Tooltip>
            <Menu anchorEl={moreAnchor} open={moreAnchor !== null} onClose={() => setMoreAnchor(null)}>
              <MenuItem onClick={() => openDialog('apply')}>
                <ListItemIcon><EventRepeatOutlinedIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Заповнити з шаблону</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => openDialog('copy')}>
                <ListItemIcon><ContentCopyOutlinedIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Скопіювати меню</ListItemText>
              </MenuItem>
              <MenuItem disabled={!institutionId} onClick={() => openDialog('unpublish')}>
                <ListItemIcon><UnpublishedOutlinedIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Зняти публікацію</ListItemText>
              </MenuItem>
            </Menu>
            <Button variant="contained" disabled={!institutionId} onClick={() => setDialog('publish')}>
              {weeks === 1 ? 'Опублікувати тиждень' : 'Опублікувати 4 тижні'}
            </Button>
          </>
        )}
      </Paper>

      {failed && key === `${institutionId}/${start}/${weeks}` ? (
        <Alert severity="error" action={<Button onClick={() => go({})}>Спробувати ще</Button>}>Не вдалося завантажити меню.</Alert>
      ) : institutions.length === 0 && !isLoadingInstitutions ? (
        <Alert severity="info">Немає доступних закладів. Створіть заклад на сторінці «Заклади».</Alert>
      ) : !ready ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gap: 1.25, overflowX: 'auto' }}>
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} variant="rounded" height={220} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: compact ? 2.5 : 0 }}>
          {rows.map((row, w) => (
            <Box key={row[0]?.date ?? w}>
              <WeekRibbon days={row} showTitle={compact} />
              <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: columnsFor(row), gap: 1.25, minWidth: 'min-content' }}>
                  {row.map((day, i) => (
                    <MenuDayCard
                      key={day.date}
                      day={day}
                      weekdayIndex={i}
                      isToday={day.date.slice(0, 10) === today}
                      compact={compact}
                      canEdit={canEdit}
                      complexes={complexes}
                      onOpen={setEditing}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {editing && <MenuDayDialog key={editing.date} day={editing} onClose={() => setEditing(null)} />}
      {dialog === 'copy' && <CopyMenuDialog onClose={() => setDialog(null)} />}
      {dialog === 'apply' && <ApplyTemplateDialog onClose={() => setDialog(null)} />}
      {(dialog === 'publish' || dialog === 'unpublish') && <MenuPeriodDialog mode={dialog} onClose={() => setDialog(null)} />}
    </Box>
  )
}
