import { useState } from 'react'
import {
  Box, Button, Chip, Collapse, IconButton, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { useMealsStore } from '../model/mealsStore'
import { formatDay, type MealComplex, type MealCourse } from '../../../shared/api'
import { categoryPrices } from '../model/prices'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardField, CardList } from '../../../shared/ui/CardList'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'

interface ComplexCardProps {
  complex: MealComplex
  categories: MealCourse[]
  today: string
  canEdit: boolean
  onEdit: () => void
  onAddPrice: (categoryId: string | null) => void
}

export const ComplexCard = ({ complex, categories, today, canEdit, onEdit, onAddPrice }: ComplexCardProps) => {
  const isPhone = useIsPhone()
  const saveComplex = useMealsStore((s) => s.saveComplex)
  const deletePrice = useMealsStore((s) => s.deletePrice)
  const isSaving = useMealsStore((s) => s.isSaving)
  const [history, setHistory] = useState(false)
  const [deletingPriceId, setDeletingPriceId] = useState<string | null>(null)
  const shownCategories = categories.filter((c) => c.active || complex.prices.some((p) => p.priceCategoryId === c.id))
  const sortedHistory = [...complex.prices].sort(
    (a, b) => a.priceCategoryName.localeCompare(b.priceCategoryName, 'uk') || b.validFrom.localeCompare(a.validFrom),
  )

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', opacity: complex.active ? 1 : 0.65 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2, pt: 1.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{complex.name}</Typography>
          {complex.description && <Typography variant="body2" color="text.secondary">{complex.description}</Typography>}
        </Box>
        <Tooltip title={complex.active ? 'Доступний для замовлення' : 'Вимкнений'}>
          <Switch
            checked={complex.active}
            disabled={!canEdit}
            onChange={(e) => saveComplex(complex.id, { active: e.target.checked }).catch(() => undefined)}
            slotProps={{ input: { 'aria-label': 'Доступний для замовлення' } }}
          />
        </Tooltip>
        {canEdit && (
          <Tooltip title="Назва і склад">
            <IconButton size="small" onClick={onEdit} aria-label="Редагувати комплекс"><EditOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 2, pt: 1, pb: 1.5 }}>
        {complex.courses.length === 0 ? (
          <Typography variant="caption" color="warning.dark">Не вибрано жодного типу страви</Typography>
        ) : (
          [...complex.courses]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((course) => <Chip key={course.id} size="small" label={course.name} variant="outlined" />)
        )}
      </Box>

      {isPhone ? (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
          <CardList
            items={shownCategories}
            getKey={(c) => c.id}
            empty={<Typography variant="body2" color="text.secondary">Спочатку створіть цінові категорії.</Typography>}
            renderCard={(category) => {
              const { current, next } = categoryPrices(complex.prices, category.id, today)
              return (
                <>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{category.name}</Typography>
                  <CardField label="Ціна зараз">
                    <Box component="span" sx={{ fontWeight: 600, color: current ? 'text.primary' : 'warning.dark' }}>
                      {current ? `${current.price} грн` : 'не задано'}
                    </Box>
                  </CardField>
                  <CardField label="Наступна зміна">{next ? `${next.price} грн з ${formatDay(next.validFrom)}` : '—'}</CardField>
                  {canEdit && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                      <Button sx={{ minHeight: 40 }} onClick={() => onAddPrice(category.id)}>Змінити</Button>
                    </Box>
                  )}
                </>
              )
            }}
          />
        </Box>
      ) : (
      <Table size="small" sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', bgcolor: 'grey.50' } }}>
            <TableCell>Цінова категорія</TableCell>
            <TableCell align="right">Ціна зараз</TableCell>
            <TableCell>Наступна зміна</TableCell>
            {canEdit && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {shownCategories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 4 : 3} sx={{ color: 'text.secondary' }}>Спочатку створіть цінові категорії.</TableCell>
            </TableRow>
          ) : (
            shownCategories.map((category) => {
              const { current, next } = categoryPrices(complex.prices, category.id, today)
              return (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: current ? 'text.primary' : 'warning.dark' }}>
                    {current ? `${current.price} грн` : 'не задано'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {next ? `${next.price} грн з ${formatDay(next.validFrom)}` : '—'}
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <Button size="small" onClick={() => onAddPrice(category.id)}>Змінити</Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      )}

      {complex.prices.length > 0 && (
        <>
          <Box
            component="button"
            type="button"
            onClick={() => setHistory((v) => !v)}
            aria-expanded={history}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', px: 2, py: 0.75, border: 0, borderTop: '1px solid',
              borderColor: 'divider', bgcolor: 'transparent', color: 'text.secondary', cursor: 'pointer', font: 'inherit', fontSize: 13,
              '&:hover': { color: 'text.primary' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
            }}
          >
            {history ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
            Історія цін ({complex.prices.length})
          </Box>
          <Collapse in={history} unmountOnExit>
            {isPhone ? (
              <Box sx={{ p: 1.5 }}>
                <CardList
                  items={sortedHistory}
                  getKey={(p) => p.id}
                  renderCard={(p) => (
                    <>
                      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{p.priceCategoryName}</Typography>
                      <CardField label="Ціна">{p.price} грн</CardField>
                      <CardField label="Діє">з {formatDay(p.validFrom)}</CardField>
                      {canEdit && p.validFrom.slice(0, 10) > today && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                          <IconButton
                            sx={{ width: 40, height: 40 }}
                            disabled={isSaving}
                            aria-label="Видалити майбутню ціну"
                            onClick={() => setDeletingPriceId(p.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </>
                  )}
                />
              </Box>
            ) : (
            <Table size="small">
              <TableBody>
                {sortedHistory.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.priceCategoryName}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{p.price} грн</TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>з {formatDay(p.validFrom)}</TableCell>
                    <TableCell align="right">
                      {canEdit && p.validFrom.slice(0, 10) > today && (
                        <Tooltip title="Видалити майбутню ціну">
                          <IconButton size="small" disabled={isSaving} onClick={() => setDeletingPriceId(p.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </Collapse>
        </>
      )}
      <ConfirmDialog
        open={deletingPriceId !== null}
        title="Видалити майбутню ціну?"
        onConfirm={() => deletingPriceId && deletePrice(complex.id, deletingPriceId)}
        onClose={() => setDeletingPriceId(null)}
      />
    </Paper>
  )
}
