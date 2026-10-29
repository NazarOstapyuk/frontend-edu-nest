import { Box, Button, Chip, Paper, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import type { MealComplex, MenuDayView } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { groupDishesByCourse } from '../model/dayDishes'
import { complexAvailability, dayState, longDate, weekdayNames } from '../model/menuDay'
import { ComplexChips } from './ComplexChips'
import { DishRows } from './DishRows'

const railColor = {
  off: 'transparent',
  empty: 'transparent',
  draft: 'warning.main',
  published: 'success.main',
} as const

const statusLabel = { draft: 'Чернетка', published: 'Опубліковано' } as const

interface MenuDayCardProps {
  day: MenuDayView
  weekdayIndex: number
  isToday: boolean
  compact: boolean
  canEdit: boolean
  complexes: MealComplex[]
  onOpen: (day: MenuDayView) => void
}

export const MenuDayCard = ({ day, weekdayIndex, isToday, compact, canEdit, complexes, onOpen }: MenuDayCardProps) => {
  const isPhone = useIsPhone()
  const state = dayState(day)
  const clickable = canEdit && day.working
  const rows = groupDishesByCourse(day.menu?.dishes ?? [])
  const availability = state === 'draft' || state === 'published' ? complexAvailability(day, complexes) : []

  if (state === 'off' && !day.menu) {
    return (
      <Box
        sx={{
          borderRadius: 1.5,
          minHeight: isPhone ? 44 : compact ? 96 : 220,
          px: isPhone ? 1.5 : 1,
          py: isPhone ? 1 : 1.5,
          display: 'flex',
          flexDirection: isPhone ? 'row' : 'column',
          alignItems: 'center',
          gap: isPhone ? 1.5 : 0.5,
          color: 'text.disabled',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 6px, transparent 6px 12px)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {isPhone ? `${weekdayNames[weekdayIndex]}, ${longDate(day.date)}` : weekdayNames[weekdayIndex].slice(0, 2)}
        </Typography>
        <Typography variant="caption" sx={isPhone ? undefined : { writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          {day.title ?? 'Вихідний'}
        </Typography>
      </Box>
    )
  }

  return (
    <Paper
      elevation={0}
      onClick={() => clickable && onOpen(day)}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen(day)
        }
      }}
      tabIndex={clickable ? 0 : -1}
      role={clickable ? 'button' : undefined}
      aria-label={`${weekdayNames[weekdayIndex]}, ${longDate(day.date)}`}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1.5,
        border: state === 'empty' ? '1px dashed' : '1px solid',
        borderColor: isToday ? 'primary.main' : 'divider',
        boxShadow: isToday ? (t) => `0 0 0 1px ${t.palette.primary.main}` : 'none',
        bgcolor: state === 'off' ? 'grey.50' : 'background.paper',
        minHeight: isPhone ? 0 : compact ? 96 : 220,
        display: 'flex',
        flexDirection: 'column',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color 120ms, background-color 120ms',
        '&:hover': clickable ? { borderColor: 'primary.light', bgcolor: state === 'empty' ? 'grey.50' : 'background.paper' } : undefined,
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: railColor[state],
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 1.5, pt: 1.25, pb: 0.75 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: compact ? 14 : 15, lineHeight: 1.2 }}>
            {compact ? weekdayNames[weekdayIndex].slice(0, 2) : weekdayNames[weekdayIndex]}
          </Typography>
          <Typography variant="caption" color={isToday ? 'primary.main' : 'text.secondary'} sx={{ fontWeight: isToday ? 600 : 400 }}>
            {isToday ? `Сьогодні, ${longDate(day.date)}` : longDate(day.date)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        {(state === 'draft' || state === 'published') && !compact && (
          <Chip
            size="small"
            variant={state === 'published' ? 'filled' : 'outlined'}
            color={state === 'published' ? 'success' : 'warning'}
            label={statusLabel[state]}
          />
        )}
      </Box>

      {state === 'off' && (
        <Typography variant="caption" color="warning.dark" sx={{ px: 1.5 }}>
          Неробочий день{day.title ? `: ${day.title}` : ''}. Замовлень: {day.menu?.activeOrders ?? 0}
        </Typography>
      )}

      {state === 'empty' ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, px: 1.5, pb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">Меню ще немає</Typography>
          {canEdit && !compact && (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={(e) => { e.stopPropagation(); onOpen(day) }}>
              Скласти меню
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ flex: 1, px: 1.5, pb: compact ? 1 : 0.5 }}>
          <DishRows rows={rows} compact={compact} />
        </Box>
      )}

      {(availability.length > 0 || (day.menu?.activeOrders ?? 0) > 0) && !compact && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, px: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <ComplexChips items={availability} />
          <Box sx={{ flex: 1 }} />
          {(day.menu?.activeOrders ?? 0) > 0 && (
            <Tooltip title="Активні замовлення">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <RestaurantOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{day.menu?.activeOrders}</Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      )}
    </Paper>
  )
}
