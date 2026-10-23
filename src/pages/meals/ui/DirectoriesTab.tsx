import { useMemo, useState } from 'react'
import {
  Box, Button, FormControlLabel, InputAdornment, Paper, Switch, Tab, Tabs, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { useMealsStore } from '../model/mealsStore'
import { SortedNameDialog } from './SortedNameDialog'
import { DishDialog } from './DishDialog'
import { DishTypeBlock } from './DishTypeBlock'
import { ComplexDialog } from './ComplexDialog'
import { ComplexCard } from './ComplexCard'
import { PriceDialog } from './PriceDialog'
import { NamedList } from './NamedList'
import { useCan } from '../../../entities/user'
import { localToday, type Dish, type MealComplex, type MealCourse } from '../../../shared/api'

type Section = 'dishes' | 'complexes' | 'lists' | 'orders'
type NamedTarget = { kind: 'course' | 'category'; item: MealCourse | null } | null
type DishTarget = { dish: Dish | null; courseId: string | null } | null
type PriceTarget = { complex: MealComplex; categoryId: string | null } | null

const dishWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'страва' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'страви' : 'страв')
const groupWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'група' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'групи' : 'груп')

export const DirectoriesTab = () => {
  const canEdit = useCan('meals', 'edit')
  const canEditSettings = useCan('settings', 'edit')
  const courses = useMealsStore((s) => s.courses)
  const dishes = useMealsStore((s) => s.dishes)
  const categories = useMealsStore((s) => s.priceCategories)
  const complexes = useMealsStore((s) => s.complexes)
  const groups = useMealsStore((s) => s.groups)
  const deadline = useMealsStore((s) => s.deadline)
  const isSaving = useMealsStore((s) => s.isSaving)
  const saveCourse = useMealsStore((s) => s.saveCourse)
  const savePriceCategory = useMealsStore((s) => s.savePriceCategory)
  const saveDeadline = useMealsStore((s) => s.saveDeadline)
  const [section, setSection] = useState<Section>('dishes')
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [named, setNamed] = useState<NamedTarget>(null)
  const [dish, setDish] = useState<DishTarget>(null)
  const [complex, setComplex] = useState<MealComplex | 'new' | null>(null)
  const [priceFor, setPriceFor] = useState<PriceTarget>(null)
  const [deadlineDraft, setDeadlineDraft] = useState<string | null>(null)
  const today = localToday()
  const needle = query.trim().toLowerCase()

  const dishesByCourse = useMemo(() => {
    const map = new Map<string, Dish[]>()
    const visible = dishes
      .filter((d) => showInactive || d.active)
      .filter((d) => !needle || d.name.toLowerCase().includes(needle) || (d.description ?? '').toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
    for (const d of visible) map.set(d.courseId, [...(map.get(d.courseId) ?? []), d])
    return map
  }, [dishes, showInactive, needle])

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk')),
    [courses],
  )
  const visibleCourses = needle ? sortedCourses.filter((c) => (dishesByCourse.get(c.id) ?? []).length > 0) : sortedCourses
  const sortedComplexes = [...complexes].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk'))

  const namedInitial = useMemo(
    () => ({ name: named?.item?.name ?? '', sortOrder: named?.item?.sortOrder ?? 0 }),
    [named],
  )

  const courseUsage = (id: string) => {
    const n = dishes.filter((d) => d.courseId === id).length
    return n ? `${n} ${dishWord(n)}` : null
  }
  const categoryUsage = (id: string) => {
    const n = groups.filter((g) => g.mealPriceCategoryId === id).length
    return n ? `${n} ${groupWord(n)}` : 'Не призначена жодній групі'
  }

  return (
    <Box>
      <Tabs
        value={section}
        onChange={(_, v: Section) => setSection(v)}
        variant="scrollable"
        sx={{ mb: 2.5, minHeight: 40, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
      >
        <Tab value="dishes" label={`Страви (${dishes.length})`} />
        <Tab value="complexes" label="Комплекси і ціни" />
        <Tab value="lists" label="Типи страв і цінові категорії" />
        <Tab value="orders" label="Замовлення" />
      </Tabs>

      {section === 'dishes' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Пошук страви"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 320 } }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            />
            <FormControlLabel
              control={<Switch size="small" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
              label="Показувати вимкнені"
            />
            <Box sx={{ flex: 1 }} />
            {canEdit && (
              <Button variant="contained" startIcon={<AddIcon />} disabled={courses.length === 0} onClick={() => setDish({ dish: null, courseId: null })}>
                Додати страву
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {courses.length === 0 ? (
              <Paper elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ mb: 1 }}>Спочатку створіть типи страв, наприклад «Перша страва» чи «Гарнір».</Typography>
                <Button onClick={() => setSection('lists')}>До типів страв</Button>
              </Paper>
            ) : visibleCourses.length === 0 ? (
              <Typography color="text.secondary">Нічого не знайдено за запитом «{query.trim()}».</Typography>
            ) : (
              visibleCourses.map((course) => (
                <DishTypeBlock
                  key={course.id}
                  course={course}
                  dishes={dishesByCourse.get(course.id) ?? []}
                  canEdit={canEdit}
                  forceExpanded={Boolean(needle)}
                  onAdd={(courseId) => setDish({ dish: null, courseId })}
                  onEdit={(d) => setDish({ dish: d, courseId: null })}
                />
              ))
            )}
          </Box>
        </Box>
      )}

      {section === 'complexes' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 260 }}>
              Комплекс — це варіант обіду з кількох типів страв за одну ціну. Ціна залежить від цінової категорії групи дитини.
            </Typography>
            {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setComplex('new')}>Додати комплекс</Button>}
          </Box>
          {sortedComplexes.length === 0 ? (
            <Paper elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">Комплексів ще немає. Додайте, наприклад, «Повний»: перша страва, гарнір, основна страва і салат.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2, alignItems: 'start' }}>
              {sortedComplexes.map((c) => (
                <ComplexCard
                  key={c.id}
                  complex={c}
                  categories={categories}
                  today={today}
                  canEdit={canEdit}
                  onEdit={() => setComplex(c)}
                  onAddPrice={(categoryId) => setPriceFor({ complex: c, categoryId })}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {section === 'lists' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2, alignItems: 'start' }}>
          <NamedList
            title="Типи страв"
            hint="Частини обіду. Порядок визначає послідовність у меню."
            addLabel="Додати"
            emptyText="Типів страв ще немає."
            items={courses}
            usage={courseUsage}
            canEdit={canEdit}
            onAdd={() => setNamed({ kind: 'course', item: null })}
            onEdit={(item) => setNamed({ kind: 'course', item })}
            onToggle={(item, active) => saveCourse(item.id, { active }).catch(() => undefined)}
          />
          <NamedList
            title="Цінові категорії"
            hint="Призначаються групам і визначають ціну комплексу."
            addLabel="Додати"
            emptyText="Цінових категорій ще немає."
            items={categories}
            usage={categoryUsage}
            canEdit={canEdit}
            onAdd={() => setNamed({ kind: 'category', item: null })}
            onEdit={(item) => setNamed({ kind: 'category', item })}
            onToggle={(item, active) => savePriceCategory(item.id, { active }).catch(() => undefined)}
          />
        </Box>
      )}

      {section === 'orders' && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2.5, maxWidth: 560 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Дедлайн замовлення</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            До цього часу в день харчування батьки можуть замовити або скасувати обід. Пізніше це може зробити лише адміністратор.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              type="time"
              label="Час"
              value={deadlineDraft ?? deadline}
              disabled={!canEditSettings}
              onChange={(e) => setDeadlineDraft(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {canEditSettings && (
              <Button
                variant="contained"
                disabled={isSaving || deadlineDraft === null || deadlineDraft === deadline || !deadlineDraft}
                onClick={() => deadlineDraft && saveDeadline(deadlineDraft).then(() => setDeadlineDraft(null)).catch(() => undefined)}
              >
                Зберегти
              </Button>
            )}
          </Box>
        </Paper>
      )}

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
      <DishDialog open={dish !== null} dish={dish?.dish ?? null} presetCourseId={dish?.courseId} onClose={() => setDish(null)} />
      <ComplexDialog open={complex !== null} complex={complex && complex !== 'new' ? complex : null} onClose={() => setComplex(null)} />
      <PriceDialog complex={priceFor?.complex ?? null} presetCategoryId={priceFor?.categoryId} onClose={() => setPriceFor(null)} />
    </Box>
  )
}
