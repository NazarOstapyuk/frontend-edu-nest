import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, IconButton, MenuItem, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useMealsStore } from '../model/mealsStore'
import { MenuDayDialog } from './MenuDayDialog'
import { CopyMenuDialog } from './CopyMenuDialog'
import { ApplyTemplateDialog } from './ApplyTemplateDialog'
import { MenuPeriodDialog } from './MenuPeriodDialog'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'
import { useCan } from '../../../entities/user'
import {
  addDaysIso, formatDay, isoWeekdayLabels, menuStatusLabels, type MenuDayView,
} from '../../../shared/api'

export const MenuTab = () => {
  const canEdit = useCan('meals', 'edit')
  const institutionId = useMealsStore((s) => s.menuInstitutionId)
  const allInstitutions = useInstitutionStore((s) => s.institutions)
  const institutions = useEffectiveInstitutions()
  const isLoadingInstitutions = useInstitutionStore((s) => s.isLoading)
  const selectedId = useInstitutionStore((s) => s.selectedId)
  const loadInstitutions = useInstitutionStore((s) => s.load)
  const start = useMealsStore((s) => s.menuStart)
  const weeks = useMealsStore((s) => s.menuWeeks)
  const key = useMealsStore((s) => s.menuKey)
  const days = useMealsStore((s) => s.menuDays)
  const failed = useMealsStore((s) => s.menuFailed)
  const loadMenu = useMealsStore((s) => s.loadMenu)
  const [editing, setEditing] = useState<MenuDayView | null>(null)
  const [dialog, setDialog] = useState<'copy' | 'apply' | 'publish' | 'unpublish' | null>(null)
  const initialId = selectedId ?? institutions.find((i) => i.isActive)?.id ?? ''
  const ready = key === `${institutionId}/${start}/${weeks}` && days.length > 0

  useEffect(() => {
    if (allInstitutions.length === 0) loadInstitutions().catch(() => undefined)
  }, [allInstitutions.length, loadInstitutions])

  useEffect(() => {
    loadMenu({ institutionId: initialId }).catch(() => undefined)
  }, [loadMenu, initialId])

  const rows = Array.from({ length: weeks }, (_, w) => days.slice(w * 7, w * 7 + 7))

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <TextField select size="small" label="Заклад" value={institutionId} onChange={(e) => loadMenu({ institutionId: e.target.value }).catch(() => undefined)} sx={{ minWidth: 200 }}>
          {institutions.map((i) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
        </TextField>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => loadMenu({ start: addDaysIso(start, -7 * weeks) }).catch(() => undefined)}><ChevronLeftIcon /></IconButton>
          <Typography sx={{ minWidth: 200, textAlign: 'center' }}>{formatDay(start)} – {formatDay(addDaysIso(start, weeks * 7 - 1))}</Typography>
          <IconButton onClick={() => loadMenu({ start: addDaysIso(start, 7 * weeks) }).catch(() => undefined)}><ChevronRightIcon /></IconButton>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={weeks} onChange={(_, v: 1 | 4 | null) => v && loadMenu({ weeks: v }).catch(() => undefined)}>
          <ToggleButton value={1}>Тиждень</ToggleButton>
          <ToggleButton value={4}>4 тижні</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        {canEdit && <Button onClick={() => setDialog('apply')}>Застосувати шаблон</Button>}
        {canEdit && <Button onClick={() => setDialog('copy')}>Копіювати</Button>}
        {canEdit && <Button disabled={!institutionId} onClick={() => setDialog('unpublish')}>Зняти публікацію</Button>}
        {canEdit && <Button variant="contained" disabled={!institutionId} onClick={() => setDialog('publish')}>Опублікувати період</Button>}
      </Box>

      {failed && key === `${institutionId}/${start}/${weeks}` ? (
        <Alert severity="error" action={<Button onClick={() => loadMenu().catch(() => undefined)}>Спробувати ще</Button>}>Не вдалося завантажити дані.</Alert>
      ) : institutions.length === 0 && !isLoadingInstitutions ? (
        <Typography color="text.secondary">Немає доступних закладів.</Typography>
      ) : !ready ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : (
        rows.map((row, w) => (
          <Box key={w} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: 1, mb: 1, overflowX: 'auto' }}>
            {row.map((day, i) => (
              <Paper
                key={day.date}
                elevation={0}
                onClick={() => canEdit && day.working && setEditing(day)}
                sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1, minHeight: 120,
                  bgcolor: day.working ? 'background.paper' : 'grey.50',
                  cursor: canEdit && day.working ? 'pointer' : 'default',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{isoWeekdayLabels[i]} {formatDay(day.date)}</Typography>
                {!day.working ? (
                  <>
                    <Typography variant="caption" color="text.secondary">Неробочий{day.title ? `: ${day.title}` : ''}</Typography>
                    {day.menu && day.menu.activeOrders > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Chip size="small" color="warning" label={`Замовлень: ${day.menu.activeOrders} — день неробочий`} />
                      </Box>
                    )}
                  </>
                ) : !day.menu ? (
                  <Typography variant="caption" color="text.secondary">Меню немає</Typography>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', gap: 0.5, my: 0.5, flexWrap: 'wrap' }}>
                      <Chip size="small" color={day.menu.status === 'published' ? 'success' : 'default'} label={menuStatusLabels[day.menu.status]} />
                      {day.menu.activeOrders > 0 && <Chip size="small" label={`Замовлень: ${day.menu.activeOrders}`} />}
                    </Box>
                    {day.menu.dishes.map((d) => (
                      <Typography key={d.id} variant="caption" sx={{ display: 'block' }}>{d.course.name}: {d.name}</Typography>
                    ))}
                  </>
                )}
              </Paper>
            ))}
          </Box>
        ))
      )}

      {editing && <MenuDayDialog key={editing.date} day={editing} onClose={() => setEditing(null)} />}
      {dialog === 'copy' && <CopyMenuDialog onClose={() => setDialog(null)} />}
      {dialog === 'apply' && <ApplyTemplateDialog onClose={() => setDialog(null)} />}
      {(dialog === 'publish' || dialog === 'unpublish') && <MenuPeriodDialog mode={dialog} onClose={() => setDialog(null)} />}
    </Box>
  )
}
