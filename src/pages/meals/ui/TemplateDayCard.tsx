import { Box, Button, IconButton, Paper, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { MealComplex } from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'
import type { DayDishRow } from '../model/dayDishes'
import { availabilityFor, weekdayNames } from '../model/menuDay'
import { hatchedBackground } from '../model/courseColors'
import { AvailabilityList } from './CourseDayTable'
import { DishRows } from './DishRows'

interface TemplateDayCardProps {
  weekdayIndex: number
  rows: DayDishRow[]
  courseIds: string[]
  narrow: boolean
  canEdit: boolean
  complexes: MealComplex[]
  copyLabel?: string
  onCopy?: () => void
  onOpen: () => void
}

export const TemplateDayCard = ({ weekdayIndex, rows, courseIds, narrow, canEdit, complexes, copyLabel, onCopy, onOpen }: TemplateDayCardProps) => {
  const name = weekdayNames[weekdayIndex]
  const empty = rows.length === 0

  if (narrow) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 48,
          pl: 2,
          pr: 0.5,
          borderRadius: 2,
          color: 'text.secondary',
          backgroundImage: hatchedBackground,
          boxShadow: brandColors.outline,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 800, flex: 1 }}>{name}</Typography>
        <Typography variant="body2">вихідний</Typography>
        {canEdit && (
          <IconButton aria-label={`Додати страви: ${name.toLowerCase()}`} onClick={onOpen} sx={{ width: 44, height: 44 }}>
            <AddIcon />
          </IconButton>
        )}
      </Box>
    )
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, pr: 0.5, pt: 1, pb: 0.5 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>{name}</Typography>
        {canEdit && (
          <IconButton aria-label={`Змінити страви: ${name.toLowerCase()}`} onClick={onOpen} sx={{ width: 44, height: 44, color: 'text.secondary' }}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {empty ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 2, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>День порожній</Typography>
          {canEdit && <Button variant="outlined" startIcon={<AddIcon />} onClick={onOpen}>Додати страви</Button>}
          {canEdit && copyLabel && onCopy && <Button onClick={onCopy}>{copyLabel}</Button>}
        </Box>
      ) : (
        <>
          <Box sx={{ px: 2, pb: 1 }}>
            <DishRows rows={rows} />
          </Box>
          <Box sx={{ px: 2, py: 1.25, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <AvailabilityList items={availabilityFor(courseIds, complexes)} />
          </Box>
        </>
      )}
    </Paper>
  )
}
