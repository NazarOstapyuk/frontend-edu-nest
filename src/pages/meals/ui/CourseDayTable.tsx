import type { ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { brandColors } from '../../../shared/assets/brand'
import type { CourseRow } from '../model/dayDishes'
import { hatchedBackground } from '../model/courseColors'
import type { ComplexAvailability } from '../model/menuDay'

export interface CourseDayColumn {
  key: string
  type: 'day'
  header: ReactNode
  highlight?: boolean
  dishes: { name: string; courseId: string }[]
  empty?: ReactNode
  canAdd?: (courseId: string) => boolean
  onAdd?: (course: CourseRow) => void
  footer: ReactNode
}

export interface CourseOffColumn {
  key: string
  type: 'off'
  content: ReactNode
}

export type CourseTableColumn = CourseDayColumn | CourseOffColumn

export const AvailabilityList = ({ items, empty }: { items: ComplexAvailability[]; empty?: string }) => {
  if (items.length === 0) {
    return empty ? <Typography variant="body2" color="text.secondary">{empty}</Typography> : null
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {items.map((c) => {
        const ok = c.missing.length === 0
        return (
          <Box key={c.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, color: ok ? 'success.dark' : 'primary.dark' }}>
            {ok ? <CheckIcon sx={{ fontSize: 16, mt: '2px' }} /> : <ErrorOutlineIcon sx={{ fontSize: 16, mt: '2px' }} />}
            <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.4 }}>
              {ok ? c.name : `${c.name}: немає ${c.missing.map((m) => m.toLowerCase()).join(', ')}`}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

export const DishNames = ({ names, compact = false }: { names: string[]; compact?: boolean }) => (
  <>
    {names.map((name, i) => (
      <Box key={`${name}-${i}`}>
        {i > 0 && (
          <Typography component="div" sx={{ fontSize: 11, fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            або
          </Typography>
        )}
        <Typography sx={{ fontSize: compact ? 13 : 14, fontWeight: 700, lineHeight: 1.3 }}>{name}</Typography>
      </Box>
    ))}
  </>
)

interface CourseDayTableProps {
  courses: CourseRow[]
  columns: CourseTableColumn[]
  addLabel: (course: CourseRow) => string
  compact?: boolean
}

export const CourseDayTable = ({ courses, columns, addLabel, compact = false }: CourseDayTableProps) => {
  const rowCount = Math.max(courses.length, 1)
  const footerRow = rowCount + 2
  const dayWidth = compact ? 130 : 150
  const labelWidth = compact ? 130 : 150
  const template = [
    `${labelWidth}px`,
    ...columns.map((c) => (c.type === 'off' ? '52px' : `minmax(${dayWidth}px, 1fr)`)),
  ].join(' ')
  const minWidth = labelWidth + columns.reduce((sum, c) => sum + (c.type === 'off' ? 52 : dayWidth), 0)
  const pad = compact ? { px: 1.25, py: 1 } : { px: 1.75, py: 1.5 }
  const line = `1px solid ${brandColors.hairline}`
  const tint = (highlight?: boolean) => (highlight ? (t: Theme) => alpha(t.palette.primary.main, 0.06) : undefined)

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: template, minWidth }}>
        <Box sx={{ gridColumn: 1, gridRow: 1, ...pad, borderBottom: line, display: 'flex', alignItems: 'flex-end' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary' }}>Тип страви</Typography>
        </Box>

        {courses.length === 0 ? (
          <Box sx={{ gridColumn: 1, gridRow: 2, ...pad, borderBottom: line }}>
            <Typography variant="body2" color="text.secondary">Страв ще немає</Typography>
          </Box>
        ) : (
          courses.map((course, r) => (
            <Box key={course.id} sx={{ gridColumn: 1, gridRow: r + 2, ...pad, borderBottom: line, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: course.dot, mt: '5px', flexShrink: 0 }} />
              <Typography sx={{ fontSize: compact ? 13 : 14, fontWeight: 800, color: course.text }}>{course.name}</Typography>
            </Box>
          ))
        )}

        <Box sx={{ gridColumn: 1, gridRow: footerRow, ...pad, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Можна замовити</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>комплекси дня</Typography>
        </Box>

        {columns.map((column, index) => {
          const col = index + 2
          if (column.type === 'off') {
            return (
              <Box
                key={column.key}
                sx={{
                  gridColumn: col,
                  gridRow: `1 / ${footerRow + 1}`,
                  borderLeft: line,
                  backgroundImage: hatchedBackground,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.25,
                  pt: 2,
                  pb: 1,
                  color: 'text.secondary',
                }}
              >
                {column.content}
              </Box>
            )
          }
          const byCourse = new Map<string, string[]>()
          for (const d of column.dishes) byCourse.set(d.courseId, [...(byCourse.get(d.courseId) ?? []), d.name])
          const spanEmpty = column.dishes.length === 0 && column.empty
          return [
            <Box key={`${column.key}-h`} sx={{ gridColumn: col, gridRow: 1, ...pad, borderBottom: line, borderLeft: line, bgcolor: tint(column.highlight) }}>
              {column.header}
            </Box>,
            spanEmpty ? (
              <Box
                key={`${column.key}-e`}
                sx={{ gridColumn: col, gridRow: `2 / ${rowCount + 2}`, p: compact ? 1 : 1.5, borderBottom: line, borderLeft: line, bgcolor: tint(column.highlight), display: 'flex' }}
              >
                <Box
                  sx={{
                    flex: 1,
                    borderRadius: 1.5,
                    boxShadow: `inset 0 0 0 2px ${brandColors.hairline}`,
                    backgroundImage: hatchedBackground,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    p: 1.5,
                    textAlign: 'center',
                  }}
                >
                  {column.empty}
                </Box>
              </Box>
            ) : (
              (courses.length === 0 ? [null] : courses).map((course, r) => {
                const names = course ? byCourse.get(course.id) ?? [] : []
                const showAdd = course && names.length === 0 && column.onAdd && (column.canAdd?.(course.id) ?? true)
                return (
                  <Box
                    key={`${column.key}-${course?.id ?? 'none'}`}
                    sx={{
                      gridColumn: col,
                      gridRow: r + 2,
                      ...pad,
                      borderBottom: line,
                      borderLeft: line,
                      bgcolor: tint(column.highlight),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25,
                    }}
                  >
                    {names.length > 0 ? (
                      <DishNames names={names} compact={compact} />
                    ) : showAdd ? (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => column.onAdd?.(course)}
                        sx={{ alignSelf: 'flex-start', minHeight: 34, px: 1.25, bgcolor: brandColors.orangeTint, '&:hover': { bgcolor: brandColors.orangeTint } }}
                      >
                        {addLabel(course)}
                      </Button>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </Box>
                )
              })
            ),
            <Box
              key={`${column.key}-f`}
              sx={{ gridColumn: col, gridRow: footerRow, ...pad, bgcolor: column.highlight ? tint(true) : 'grey.50', borderLeft: line }}
            >
              {column.footer}
            </Box>,
          ]
        })}
      </Box>
    </Box>
  )
}
