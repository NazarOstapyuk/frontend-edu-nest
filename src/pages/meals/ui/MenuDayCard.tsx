import { Box, Button, Chip, IconButton, Paper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { MealComplex, MenuDayView } from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import { groupDishesByCourse } from '../model/dayDishes'
import { complexAvailability, dayState, longDate, ordersLabel, shortDate, weekdayNames, weekdayShortNames } from '../model/menuDay'
import { AvailabilityList } from './CourseDayTable'
import { hatchedBackground } from '../model/courseColors'
import { DishRows } from './DishRows'

export const MenuStatusChip = ({ day }: { day: MenuDayView }) => {
  if (!day.menu) return <Chip size="small" variant="outlined" label="Меню немає" />
  if (day.menu.status === 'published') return <Chip size="small" color="success" label="Опубліковано" />
  return <Chip size="small" label="Чернетка" sx={{ bgcolor: brandColors.orangeTint, color: 'primary.dark' }} />
}

const ordersText = (day: MenuDayView) => {
  if (!day.menu) return null
  if (day.menu.status === 'draft' && day.menu.activeOrders === 0) return 'ще не видно батькам'
  return day.menu.activeOrders === 0 ? 'замовлень немає' : ordersLabel(day.menu.activeOrders)
}

interface MenuDayHeaderProps {
  day: MenuDayView
  weekdayIndex: number
  isToday: boolean
  canEdit: boolean
  compact?: boolean
  onEdit: (day: MenuDayView) => void
}

export const MenuDayHeader = ({ day, weekdayIndex, isToday, canEdit, compact = false, onEdit }: MenuDayHeaderProps) => {
  const name = weekdayNames[weekdayIndex]
  const date = compact ? shortDate(day.date) : longDate(day.date)
  const orders = ordersText(day)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: compact ? 14 : 16, fontWeight: 900, lineHeight: 1.25 }}>
            {compact ? weekdayShortNames[weekdayIndex] : name}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: isToday ? 'primary.dark' : 'text.secondary' }}>
            {isToday ? `Сьогодні, ${date}` : date}
          </Typography>
        </Box>
        {canEdit && day.working && (
          <IconButton
            aria-label={`Змінити меню: ${name.toLowerCase()}`}
            onClick={() => onEdit(day)}
            sx={{ width: { xs: 44, sm: 36 }, height: { xs: 44, sm: 36 }, mt: -0.5, mr: -0.75, color: 'text.secondary' }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <MenuStatusChip day={day} />
        {orders && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>{orders}</Typography>}
      </Box>
      {!day.working && (
        <Typography variant="caption" color="warning.dark">Неробочий день{day.title ? `: ${day.title}` : ''}</Typography>
      )}
    </Box>
  )
}

interface MenuDayCardProps {
  day: MenuDayView
  weekdayIndex: number
  isToday: boolean
  canEdit: boolean
  complexes: MealComplex[]
  onOpen: (day: MenuDayView) => void
}

export const MenuDayCard = ({ day, weekdayIndex, isToday, canEdit, complexes, onOpen }: MenuDayCardProps) => {
  if (dayState(day) === 'off' && !day.menu) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          columnGap: 1.5,
          minHeight: 44,
          px: 2,
          py: 0.75,
          borderRadius: 2,
          color: 'text.secondary',
          backgroundImage: hatchedBackground,
          boxShadow: brandColors.outline,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {weekdayNames[weekdayIndex]}, {longDate(day.date)}
        </Typography>
        <Typography variant="body2">{day.title ?? 'вихідний'}</Typography>
      </Box>
    )
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: isToday ? (t) => `0 0 0 2px ${t.palette.primary.main}` : undefined,
      }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <MenuDayHeader day={day} weekdayIndex={weekdayIndex} isToday={isToday} canEdit={canEdit} onEdit={onOpen} />
      </Box>
      {day.menu ? (
        <Box sx={{ px: 2, pb: 1 }}>
          <DishRows rows={groupDishesByCourse(day.menu.dishes)} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, px: 2, pb: 2 }}>
          <Typography variant="body2" color="text.secondary">Меню ще немає</Typography>
          {canEdit && day.working && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => onOpen(day)} fullWidth>
              Скласти меню
            </Button>
          )}
        </Box>
      )}
      {day.menu && (
        <Box sx={{ px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <AvailabilityList items={complexAvailability(day, complexes)} />
        </Box>
      )}
    </Paper>
  )
}
