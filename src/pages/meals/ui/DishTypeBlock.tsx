import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { useMealsStore } from '../model/mealsStore'
import type { Dish, MealCourse } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'

interface DishTypeBlockProps {
  course: MealCourse
  dishes: Dish[]
  canEdit: boolean
  onAdd: (courseId: string) => void
  onEdit: (dish: Dish) => void
  forceExpanded?: boolean
}

export const DishTypeBlock = ({ course, dishes, canEdit, onAdd, onEdit, forceExpanded = false }: DishTypeBlockProps) => {
  const isPhone = useIsPhone()
  const saveDish = useMealsStore((s) => s.saveDish)
  const [open, setExpanded] = useState(false)
  const expanded = forceExpanded || open
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const lastPage = Math.max(0, Math.ceil(dishes.length / rowsPerPage) - 1)
  const currentPage = Math.min(page, lastPage)
  const paged = dishes.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)
  const columns = canEdit ? 4 : 3

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, px: 2, py: 1.5 }}>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
        </IconButton>
        <Typography
          sx={{ fontWeight: 600, cursor: 'pointer', opacity: course.active ? 1 : 0.5 }}
          onClick={() => setExpanded((v) => !v)}
        >
          {course.name}
        </Typography>
        <Chip size="small" variant="outlined" label={`Страв: ${dishes.length}`} />
        {!course.active && <Chip size="small" label="Неактивний" />}
        <Box sx={{ flexGrow: 1 }} />
        {canEdit && course.active && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => onAdd(course.id)}>
            Додати страву
          </Button>
        )}
      </Box>

      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
          {isPhone ? (
            <Box sx={{ p: 1.5 }}>
              <CardList
                items={paged}
                getKey={(d) => d.id}
                empty={<Typography variant="body2" color="text.secondary">Страв цього типу ще немає.</Typography>}
                renderCard={(d) => (
                  <Box sx={{ opacity: d.active ? 1 : 0.6 }}>
                    <Typography sx={{ fontWeight: 600 }}>{d.name}</Typography>
                    {d.description && <Typography variant="body2" color="text.secondary">{d.description}</Typography>}
                    <CardField label="Активна">
                      <Switch
                        size="small"
                        checked={d.active}
                        disabled={!canEdit}
                        onChange={(e) => saveDish(d.id, { active: e.target.checked }).catch(() => undefined)}
                        slotProps={{ input: { 'aria-label': `${d.name}: активна` } }}
                      />
                    </CardField>
                    {canEdit && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                        <IconButton sx={{ width: 40, height: 40 }} onClick={() => onEdit(d)} aria-label={`Редагувати ${d.name}`}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                )}
              />
            </Box>
          ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Назва</TableCell>
                <TableCell>Опис</TableCell>
                <TableCell>Активна</TableCell>
                {canEdit && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {dishes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns} sx={{ color: 'text.secondary' }}>Страв цього типу ще немає.</TableCell>
                </TableRow>
              ) : (
                paged.map((d) => (
                  <TableRow key={d.id} sx={{ opacity: d.active ? 1 : 0.5 }}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{d.description ?? ''}</TableCell>
                    <TableCell>
                      <Switch
                        checked={d.active}
                        disabled={!canEdit}
                        onChange={(e) => saveDish(d.id, { active: e.target.checked }).catch(() => undefined)}
                      />
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => onEdit(d)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          )}
          {dishes.length > 0 && (
            <TablePagination
              component="div"
              count={dishes.length}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={isPhone ? [] : [10, 25, 50, 100]}
              onPageChange={(_, next) => setPage(next)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value))
                setPage(0)
              }}
              labelRowsPerPage="Рядків на сторінці:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} з ${count}`}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}
