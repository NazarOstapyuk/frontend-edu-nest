import { Box, Tooltip, Typography } from '@mui/material'
import type { MenuDayView } from '../../../shared/api'
import { dayState, longDate, weekSummary, weekdayNames } from '../model/menuDay'

const segmentColor = {
  off: 'transparent',
  empty: 'grey.300',
  draft: 'warning.main',
  published: 'success.main',
} as const

const segmentLabel = {
  off: 'вихідний',
  empty: 'меню немає',
  draft: 'чернетка',
  published: 'опубліковано',
} as const

const Figure = ({ value, label }: { value: string | number; label: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
)

export const WeekRibbon = ({ days, showTitle }: { days: MenuDayView[]; showTitle: boolean }) => {
  const summary = weekSummary(days)
  const first = days[0]
  const last = days[days.length - 1]

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, md: 3 }, mb: 1.25 }}>
      {showTitle && first && last && (
        <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 170 }}>
          {longDate(first.date)} – {longDate(last.date)}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }} aria-label="Стан днів тижня">
        {days.map((day, i) =>
          dayState(day) === 'off' ? null : (
            <Tooltip key={day.date} title={`${weekdayNames[i]}: ${segmentLabel[dayState(day)]}`}>
              <Box sx={{ width: 28, height: 8, borderRadius: 4, bgcolor: segmentColor[dayState(day)] }} />
            </Tooltip>
          ),
        )}
      </Box>
      <Figure value={`${summary.filled}/${summary.working}`} label="днів заповнено" />
      <Figure value={summary.published} label="опубліковано" />
      <Figure value={summary.orders} label={summary.orders === 1 ? 'замовлення' : 'замовлень'} />
    </Box>
  )
}
