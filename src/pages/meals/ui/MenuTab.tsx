import { useEffect, useState, type ReactNode } from 'react'
import {
  Alert, Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Skeleton, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined'
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined'
import { useMealsStore } from '../model/mealsStore'
import { MenuDayDialog } from './MenuDayDialog'
import { CopyMenuDialog } from './CopyMenuDialog'
import { ApplyTemplateDialog } from './ApplyTemplateDialog'
import { MenuPeriodDialog } from './MenuPeriodDialog'
import { MenuDayCard, MenuDayHeader } from './MenuDayCard'
import { AvailabilityList, CourseDayTable, type CourseTableColumn } from './CourseDayTable'
import { courseRowsFor } from '../model/dayDishes'
import { complexAvailability, ordersWord, rangeLabel, weekSummary, weekdayShortNames } from '../model/menuDay'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { brandColors } from '../../../shared/assets/brand'
import { addDaysIso, localToday, weekStart, type MenuDayView } from '../../../shared/api'

const LegendMark = ({ kind }: { kind: 'published' | 'draft' | 'empty' }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: '3px',
      flexShrink: 0,
      bgcolor: kind === 'published' ? 'success.main' : kind === 'draft' ? 'primary.main' : 'transparent',
      boxShadow: kind === 'empty' ? (t) => `inset 0 0 0 1.5px ${t.palette.text.disabled}` : undefined,
    }}
  />
)

const SummaryText = ({ days }: { days: MenuDayView[] }) => {
  const s = weekSummary(days)
  return (
    <Typography variant="body2" color="text.secondary">
      <Box component="b" sx={{ color: 'text.primary' }}>{s.filled} з {s.working}</Box> днів заповнено ·{' '}
      <Box component="b" sx={{ color: 'text.primary' }}>{s.orders}</Box> {ordersWord(s.orders)}
    </Typography>
  )
}

const offNote = (run: MenuDayView[]) => {
  const titles = [...new Set(run.map((d) => d.title).filter(Boolean))]
  if (titles.length === 1) return titles[0] as string
  return run.length > 1 ? 'вихідні' : 'вихідний'
}

export const MenuTab = () => {
  const isPhone = useIsPhone()
  const canEdit = useCan('meals', 'edit')
  const institutionId = useMealsStore((s) => s.menuInstitutionId)
  const allInstitutions = useInstitutionStore((s) => s.institutions)
  const institutions = useEffectiveInstitutions()
  const isLoadingInstitutions = useInstitutionStore((s) => s.isLoading)
  const selectedId = useInstitutionStore((s) => s.selectedId)
  const loadInstitutions = useInstitutionStore((s) => s.load)
  const complexes = useMealsStore((s) => s.complexes)
  const courses = useMealsStore((s) => s.courses)
  const start = useMealsStore((s) => s.menuStart)
  const weeks = useMealsStore((s) => s.menuWeeks)
  const key = useMealsStore((s) => s.menuKey)
  const days = useMealsStore((s) => s.menuDays)
  const failed = useMealsStore((s) => s.menuFailed)
  const loadMenu = useMealsStore((s) => s.loadMenu)
  const [editing, setEditing] = useState<MenuDayView | null>(null)
  const [dialog, setDialog] = useState<'copy' | 'apply' | 'publish' | 'unpublish' | null>(null)
  const [fillAnchor, setFillAnchor] = useState<HTMLElement | null>(null)
  const initialId = selectedId ?? institutions.find((i) => i.isActive)?.id ?? ''
  const ready = key === `${institutionId}/${start}/${weeks}` && days.length > 0
  const today = localToday()
  const thisWeek = weekStart(today)
  const compact = weeks === 4
  const end = addDaysIso(start, weeks * 7 - 1)
  const drafts = days.filter((d) => d.menu?.status === 'draft').length

  useEffect(() => {
    if (allInstitutions.length === 0) loadInstitutions().catch(() => undefined)
  }, [allInstitutions.length, loadInstitutions])

  useEffect(() => {
    loadMenu({ institutionId: initialId }).catch(() => undefined)
  }, [loadMenu, initialId])

  const rows = Array.from({ length: weeks }, (_, w) => days.slice(w * 7, w * 7 + 7))
  const go = (patch: Parameters<typeof loadMenu>[0]) => loadMenu(patch).catch(() => undefined)
  const activeComplexes = complexes.filter((c) => c.active)
  const required = new Set(activeComplexes.flatMap((c) => c.courses.map((course) => course.id)))
  const courseRows = courseRowsFor(
    [...days.flatMap((d) => d.menu?.dishes.map((dish) => dish.course) ?? []), ...activeComplexes.flatMap((c) => c.courses)],
    courses,
  )

  const openFill = (next: 'copy' | 'apply' | 'unpublish') => {
    setFillAnchor(null)
    setDialog(next)
  }

  const weekColumns = (week: MenuDayView[]): CourseTableColumn[] => {
    const columns: CourseTableColumn[] = []
    let i = 0
    while (i < week.length) {
      const day = week[i]
      if (!day.working && !day.menu) {
        const run: { day: MenuDayView; index: number }[] = []
        while (i < week.length && !week[i].working && !week[i].menu) {
          run.push({ day: week[i], index: i })
          i += 1
        }
        columns.push({
          key: run[0].day.date,
          type: 'off',
          content: (
            <>
              {run.map((r) => (
                <Typography key={r.day.date} sx={{ fontSize: 12, fontWeight: 800 }}>{weekdayShortNames[r.index]}</Typography>
              ))}
              <Typography sx={{ fontSize: 12, fontWeight: 700, writingMode: 'vertical-rl', transform: 'rotate(180deg)', mt: 1 }}>
                {offNote(run.map((r) => r.day))}
              </Typography>
            </>
          ),
        })
        continue
      }
      const index = i
      const editable = canEdit && day.working
      let empty: ReactNode = undefined
      if (!day.menu) {
        empty = (
          <>
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Меню ще немає</Typography>
            {editable && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setEditing(day)}>
                Скласти меню
              </Button>
            )}
          </>
        )
      }
      columns.push({
        key: day.date,
        type: 'day',
        highlight: day.date.slice(0, 10) === today,
        header: (
          <MenuDayHeader
            day={day}
            weekdayIndex={index}
            isToday={day.date.slice(0, 10) === today}
            canEdit={canEdit}
            compact={compact}
            onEdit={setEditing}
          />
        ),
        dishes: day.menu?.dishes.map((d) => ({ name: d.name, courseId: d.course.id })) ?? [],
        empty,
        canAdd: (courseId) => required.has(courseId),
        onAdd: editable ? () => setEditing(day) : undefined,
        footer: day.menu ? <AvailabilityList items={complexAvailability(day, complexes)} /> : null,
      })
      i += 1
    }
    return columns
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2.5, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', p: 1.5 }}>
          <TextField
            select
            size="small"
            label="Заклад"
            value={institutionId}
            onChange={(e) => go({ institutionId: e.target.value })}
            sx={{ minWidth: 200, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
          >
            {institutions.map((i) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
          </TextField>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: { xs: '1 1 100%', sm: '0 0 auto' }, justifyContent: 'space-between' }}>
            <IconButton
              aria-label={weeks === 1 ? 'Попередній тиждень' : 'Попередні 4 тижні'}
              onClick={() => go({ start: addDaysIso(start, -7 * weeks) })}
              sx={{ width: 44, height: 44, bgcolor: 'background.default' }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Box sx={{ minWidth: 190, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{rangeLabel(start, end)}</Typography>
              {start === thisWeek ? (
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.dark' }}>Цей тиждень</Typography>
              ) : (
                <Button size="small" onClick={() => go({ start: thisWeek })} sx={{ minHeight: 24, py: 0, px: 1, fontSize: 12 }}>
                  Цей тиждень
                </Button>
              )}
            </Box>
            <IconButton
              aria-label={weeks === 1 ? 'Наступний тиждень' : 'Наступні 4 тижні'}
              onClick={() => go({ start: addDaysIso(start, 7 * weeks) })}
              sx={{ width: 44, height: 44, bgcolor: 'background.default' }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={weeks}
            onChange={(_, v: 1 | 4 | null) => v && go({ weeks: v })}
            aria-label="Період"
            sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, '& .MuiToggleButton-root': { flex: { xs: 1, sm: 'none' }, minHeight: 40 } }}
          >
            <ToggleButton value={1}>Тиждень</ToggleButton>
            <ToggleButton value={4}>4 тижні</ToggleButton>
          </ToggleButtonGroup>

          {canEdit && (
            <>
              <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
              <Button
                color="inherit"
                startIcon={<EditCalendarOutlinedIcon />}
                endIcon={<ExpandMoreIcon />}
                onClick={(e) => setFillAnchor(e.currentTarget)}
                aria-haspopup="menu"
                aria-expanded={fillAnchor ? 'true' : undefined}
                sx={{ bgcolor: 'background.default', width: { xs: '100%', sm: 'auto' } }}
              >
                Заповнити
              </Button>
              <Menu anchorEl={fillAnchor} open={fillAnchor !== null} onClose={() => setFillAnchor(null)}>
                <MenuItem onClick={() => openFill('apply')} sx={{ minHeight: 44 }}>
                  <ListItemIcon><EventRepeatOutlinedIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>З шаблону</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => openFill('copy')} sx={{ minHeight: 44 }}>
                  <ListItemIcon><ContentCopyOutlinedIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Скопіювати меню</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => openFill('unpublish')} disabled={!institutionId} sx={{ minHeight: 44 }}>
                  <ListItemIcon><UnpublishedOutlinedIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Зняти публікацію</ListItemText>
                </MenuItem>
              </Menu>
              <Button
                variant="contained"
                disabled={!institutionId}
                onClick={() => setDialog('publish')}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
                endIcon={
                  drafts > 0 ? (
                    <Box
                      component="span"
                      aria-label={`Чернеток: ${drafts}`}
                      sx={{ bgcolor: brandColors.inkOnOrange, color: 'background.paper', borderRadius: 999, fontSize: 12, fontWeight: 800, px: 0.9, lineHeight: '18px' }}
                    >
                      {drafts}
                    </Box>
                  ) : undefined
                }
              >
                Опублікувати
              </Button>
            </>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.75,
            px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50',
          }}
        >
          {([
            ['published', 'Опубліковано: батьки бачать і замовляють'],
            ['draft', 'Чернетка: батьки ще не бачать'],
            ['empty', 'Меню немає'],
          ] as const).map(([kind, text]) => (
            <Box key={kind} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <LegendMark kind={kind} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>{text}</Typography>
            </Box>
          ))}
          <Box sx={{ flex: 1 }} />
          {ready && <SummaryText days={days} />}
        </Box>
      </Paper>

      {failed && key === `${institutionId}/${start}/${weeks}` ? (
        <Alert severity="error" action={<Button onClick={() => go({})}>Спробувати ще</Button>}>Не вдалося завантажити меню.</Alert>
      ) : institutions.length === 0 && !isLoadingInstitutions ? (
        <Alert severity="info">Немає доступних закладів. Створіть заклад на сторінці «Заклади».</Alert>
      ) : !ready ? (
        <Skeleton variant="rounded" height={isPhone ? 480 : 420} sx={{ borderRadius: 2 }} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {rows.map((week, w) => (
            <Box key={week[0]?.date ?? w}>
              {compact && week.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, mb: 1 }}>
                  <Typography sx={{ fontWeight: 800 }}>{rangeLabel(week[0].date.slice(0, 10), week[week.length - 1].date.slice(0, 10))}</Typography>
                  <SummaryText days={week} />
                </Box>
              )}
              {isPhone ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {week.map((day, i) => (
                    <MenuDayCard
                      key={day.date}
                      day={day}
                      weekdayIndex={i}
                      isToday={day.date.slice(0, 10) === today}
                      canEdit={canEdit}
                      complexes={complexes}
                      onOpen={setEditing}
                    />
                  ))}
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <CourseDayTable
                    courses={courseRows}
                    columns={weekColumns(week)}
                    compact={compact}
                    addLabel={(course) => `Додати ${course.name.toLowerCase()}`}
                  />
                </Paper>
              )}
            </Box>
          ))}
          {!isPhone && canEdit && (
            <Typography variant="body2" color="text.secondary">
              Натисніть на олівець біля дня, щоб змінити страви. Якщо в дні кілька страв одного типу, батьки обирають одну з них.
            </Typography>
          )}
        </Box>
      )}

      {editing && <MenuDayDialog key={editing.date} day={editing} onClose={() => setEditing(null)} />}
      {dialog === 'copy' && <CopyMenuDialog onClose={() => setDialog(null)} />}
      {dialog === 'apply' && <ApplyTemplateDialog onClose={() => setDialog(null)} />}
      {(dialog === 'publish' || dialog === 'unpublish') && <MenuPeriodDialog mode={dialog} onClose={() => setDialog(null)} />}
    </Box>
  )
}
