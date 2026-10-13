import { useMemo, useState } from 'react'
import {
  Box, Button, Chip, IconButton, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { useMealsStore } from '../model/mealsStore'
import { SortedNameDialog } from './SortedNameDialog'
import { DishDialog } from './DishDialog'
import { ComplexDialog } from './ComplexDialog'
import { PriceDialog } from './PriceDialog'
import { formatDay, localToday, type Dish, type MealComplex, type MealCourse } from '../../../shared/api'

type NamedTarget = { kind: 'course' | 'category'; item: MealCourse | null } | null

const cardSx = { border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto', mb: 3 }
const headSx = { '& th': { fontWeight: 700, bgcolor: 'grey.50' } }

export const DirectoriesTab = () => {
  const courses = useMealsStore((s) => s.courses)
  const dishes = useMealsStore((s) => s.dishes)
  const categories = useMealsStore((s) => s.priceCategories)
  const complexes = useMealsStore((s) => s.complexes)
  const deadline = useMealsStore((s) => s.deadline)
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveCourse = useMealsStore((s) => s.saveCourse)
  const savePriceCategory = useMealsStore((s) => s.savePriceCategory)
  const saveDish = useMealsStore((s) => s.saveDish)
  const saveComplex = useMealsStore((s) => s.saveComplex)
  const deletePrice = useMealsStore((s) => s.deletePrice)
  const saveDeadline = useMealsStore((s) => s.saveDeadline)
  const [named, setNamed] = useState<NamedTarget>(null)
  const [dish, setDish] = useState<Dish | 'new' | null>(null)
  const [complex, setComplex] = useState<MealComplex | 'new' | null>(null)
  const [priceFor, setPriceFor] = useState<MealComplex | null>(null)
  const [deadlineDraft, setDeadlineDraft] = useState<string | null>(null)
  const today = localToday()

  const namedInitial = useMemo(
    () => ({ name: named?.item?.name ?? '', sortOrder: named?.item?.sortOrder ?? 0 }),
    [named],
  )

  const namedTable = (kind: 'course' | 'category', title: string, items: MealCourse[]) => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        <Button startIcon={<AddIcon />} onClick={() => setNamed({ kind, item: null })}>Додати</Button>
      </Box>
      <Paper elevation={0} sx={cardSx}>
        <Table size="small">
          <TableHead><TableRow sx={headSx}><TableCell>Назва</TableCell><TableCell>Порядок</TableCell><TableCell>Активний</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>Записів ще немає.</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item.id} sx={{ opacity: item.active ? 1 : 0.5 }}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.sortOrder}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.active}
                    onChange={(e) =>
                      (kind === 'course' ? saveCourse : savePriceCategory)(item.id, { active: e.target.checked }).catch(() => undefined)
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setNamed({ kind, item })}><EditOutlinedIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          type="time"
          label="Дедлайн замовлення"
          value={deadlineDraft ?? deadline}
          onChange={(e) => setDeadlineDraft(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          variant="outlined"
          disabled={isSaving || deadlineDraft === null || deadlineDraft === deadline || !deadlineDraft}
          onClick={() => deadlineDraft && saveDeadline(deadlineDraft).then(() => setDeadlineDraft(null)).catch(() => undefined)}
        >
          Зберегти дедлайн
        </Button>
        <Typography variant="body2" color="text.secondary">Батьки замовляють і скасовують до цього часу в день харчування.</Typography>
      </Box>

      {namedTable('course', 'Типи страв', courses)}
      {namedTable('category', 'Цінові категорії', categories)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>Страви</Typography>
        <Button startIcon={<AddIcon />} onClick={() => setDish('new')}>Додати</Button>
      </Box>
      <Paper elevation={0} sx={cardSx}>
        <Table size="small">
          <TableHead><TableRow sx={headSx}><TableCell>Тип</TableCell><TableCell>Назва</TableCell><TableCell>Опис</TableCell><TableCell>Активна</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {dishes.length === 0 ? (
              <TableRow><TableCell colSpan={5} sx={{ color: 'text.secondary' }}>Страв ще немає.</TableCell></TableRow>
            ) : dishes.map((d) => (
              <TableRow key={d.id} sx={{ opacity: d.active ? 1 : 0.5 }}>
                <TableCell>{d.course.name}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{d.description ?? ''}</TableCell>
                <TableCell><Switch checked={d.active} onChange={(e) => saveDish(d.id, { active: e.target.checked }).catch(() => undefined)} /></TableCell>
                <TableCell align="right"><IconButton size="small" onClick={() => setDish(d)}><EditOutlinedIcon fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>Комплекси і ціни</Typography>
        <Button startIcon={<AddIcon />} onClick={() => setComplex('new')}>Додати</Button>
      </Box>
      {complexes.length === 0 && <Typography color="text.secondary" sx={{ mb: 2 }}>Комплексів ще немає.</Typography>}
      {complexes.map((c) => (
        <Paper key={c.id} elevation={0} sx={{ ...cardSx, p: 2, opacity: c.active ? 1 : 0.6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700 }}>{c.name}</Typography>
            {c.courses.map((course) => <Chip key={course.id} size="small" label={course.name} />)}
            <Box sx={{ flex: 1 }} />
            <Switch checked={c.active} onChange={(e) => saveComplex(c.id, { active: e.target.checked }).catch(() => undefined)} />
            <IconButton size="small" onClick={() => setComplex(c)}><EditOutlinedIcon fontSize="small" /></IconButton>
            <Button size="small" onClick={() => setPriceFor(c)}>Додати ціну</Button>
          </Box>
          {c.description && <Typography variant="body2" color="text.secondary">{c.description}</Typography>}
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead><TableRow sx={headSx}><TableCell>Категорія</TableCell><TableCell>Ціна</TableCell><TableCell>Діє з</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {c.prices.length === 0 ? (
                <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>Цін ще немає.</TableCell></TableRow>
              ) : c.prices.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.priceCategoryName}</TableCell>
                  <TableCell>{p.price} грн</TableCell>
                  <TableCell>{formatDay(p.validFrom)}</TableCell>
                  <TableCell align="right">
                    {p.validFrom > today && (
                      <IconButton size="small" disabled={isSaving} onClick={() => deletePrice(c.id, p.id).catch(() => undefined)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ))}

      <SortedNameDialog
        open={named !== null}
        title={named?.kind === 'category' ? 'Цінова категорія' : 'Тип страви'}
        initial={namedInitial}
        isSaving={isSaving}
        onClose={() => setNamed(null)}
        onSubmit={(values) =>
          named?.kind === 'category'
            ? savePriceCategory(named.item?.id ?? null, values)
            : saveCourse(named?.item?.id ?? null, values)
        }
      />
      <DishDialog open={dish !== null} dish={dish && dish !== 'new' ? dish : null} onClose={() => setDish(null)} />
      <ComplexDialog open={complex !== null} complex={complex && complex !== 'new' ? complex : null} onClose={() => setComplex(null)} />
      <PriceDialog complex={priceFor} onClose={() => setPriceFor(null)} />
    </Box>
  )
}
