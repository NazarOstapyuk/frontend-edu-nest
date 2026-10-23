import { Box, Paper, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import type { MealComplex } from '../../../shared/api'
import type { DayDishRow } from '../model/dayDishes'
import { availabilityFor, weekdayNames } from '../model/menuDay'
import { ComplexChips } from './ComplexChips'
import { DishRows } from './DishRows'

interface TemplateDayCardProps {
  weekdayIndex: number
  rows: DayDishRow[]
  courseIds: string[]
  narrow: boolean
  canEdit: boolean
  complexes: MealComplex[]
  onOpen: () => void
}

export const TemplateDayCard = ({ weekdayIndex, rows, courseIds, narrow, canEdit, complexes, onOpen }: TemplateDayCardProps) => {
  const empty = rows.length === 0
  const name = weekdayNames[weekdayIndex]
  const keyboard = (e: React.KeyboardEvent) => {
    if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onOpen()
    }
  }

  if (narrow) {
    return (
      <Tooltip title={canEdit ? `Додати страви: ${name.toLowerCase()}` : name}>
        <Box
          onClick={() => canEdit && onOpen()}
          onKeyDown={keyboard}
          tabIndex={canEdit ? 0 : -1}
          role={canEdit ? 'button' : undefined}
          aria-label={`${name}: додати страви`}
          sx={{
            borderRadius: 1.5,
            minHeight: 200,
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            color: 'text.disabled',
            border: '1px solid',
            borderColor: 'divider',
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.035) 0 6px, transparent 6px 12px)',
            cursor: canEdit ? 'pointer' : 'default',
            '&:hover': canEdit ? { color: 'primary.main', borderColor: 'primary.light' } : undefined,
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{name.slice(0, 2)}</Typography>
          {canEdit && <AddIcon fontSize="small" />}
        </Box>
      </Tooltip>
    )
  }

  const availability = empty ? [] : availabilityFor(courseIds, complexes)

  return (
    <Paper
      elevation={0}
      onClick={() => canEdit && onOpen()}
      onKeyDown={keyboard}
      tabIndex={canEdit ? 0 : -1}
      role={canEdit ? 'button' : undefined}
      aria-label={name}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1.5,
        border: empty ? '1px dashed' : '1px solid',
        borderColor: 'divider',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        cursor: canEdit ? 'pointer' : 'default',
        transition: 'border-color 120ms, background-color 120ms',
        '&:hover': canEdit ? { borderColor: 'primary.light', bgcolor: empty ? 'grey.50' : 'background.paper' } : undefined,
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: empty ? 'transparent' : 'primary.light',
        },
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: 15, px: 1.5, pt: 1.25, pb: 0.75 }}>{name}</Typography>

      {empty ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'text.secondary', pb: 2 }}>
          {canEdit && <AddIcon fontSize="small" />}
          <Typography variant="body2">{canEdit ? 'Додати страви' : 'Страв немає'}</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, px: 1.5, pb: 0.5 }}>
          <DishRows rows={rows} />
        </Box>
      )}

      {availability.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <ComplexChips items={availability} />
        </Box>
      )}
    </Paper>
  )
}
