import { useState } from 'react'
import {
  Alert, Box, Button, ButtonBase, Chip, FormControlLabel, IconButton, LinearProgress, Paper, Switch, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useMealsStore } from '../model/mealsStore'
import { TemplateDialog } from './TemplateDialog'
import { TemplateEditor } from './TemplateEditor'
import { useCan } from '../../../entities/user'
import type { MenuTemplate } from '../../../shared/api'

const weeksLabel = (n: number) => (n === 1 ? '1 тиждень' : n < 5 ? `${n} тижні` : `${n} тижнів`)

const filledDays = (t: MenuTemplate) => new Set(t.items.filter((i) => i.weekday <= 5).map((i) => `${i.week}/${i.weekday}`)).size

export const TemplatesTab = () => {
  const canEdit = useCan('meals', 'edit')
  const templates = useMealsStore((s) => s.templates)
  const failed = useMealsStore((s) => s.templatesFailed)
  const loadTemplates = useMealsStore((s) => s.loadTemplates)
  const saveTemplate = useMealsStore((s) => s.saveTemplate)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<MenuTemplate | 'new' | null>(null)
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0] ?? null

  if (failed) {
    return (
      <Alert severity="error" action={<Button onClick={() => loadTemplates().catch(() => undefined)}>Спробувати ще</Button>}>
        Не вдалося завантажити шаблони.
      </Alert>
    )
  }

  if (templates.length === 0) {
    return (
      <Paper elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, p: 5, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Шаблонів меню ще немає</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 460, mx: 'auto' }}>
          Шаблон — це меню на кілька тижнів, яке повторюється по колу. Складіть його один раз і застосовуйте до потрібних дат на вкладці «Меню».
        </Typography>
        {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog('new')}>Створити шаблон</Button>}
        <TemplateDialog open={dialog !== null} template={null} onClose={() => setDialog(null)} />
      </Paper>
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' }, gap: 2.5, alignItems: 'start' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {canEdit && (
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog('new')} sx={{ justifyContent: 'flex-start' }}>
            Новий шаблон
          </Button>
        )}
        {templates.map((t) => {
          const total = t.weeks * 5
          const filled = filledDays(t)
          const isSelected = selected?.id === t.id
          return (
            <ButtonBase
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              aria-pressed={isSelected}
              sx={{
                display: 'block',
                textAlign: 'left',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                boxShadow: isSelected ? (theme) => `0 0 0 1px ${theme.palette.primary.main}` : 'none',
                bgcolor: 'background.paper',
                p: 1.5,
                opacity: t.active ? 1 : 0.6,
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>{t.name}</Typography>
                {!t.active && <Chip size="small" label="Вимкнено" />}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {weeksLabel(t.weeks)}, заповнено {filled} з {total} днів
              </Typography>
              <LinearProgress
                variant="determinate"
                value={total ? (filled / total) * 100 : 0}
                sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
              />
            </ButtonBase>
          )
        })}
      </Box>

      {selected && (
        <Box sx={{ minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, p: 1.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{selected.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Цикл на {weeksLabel(selected.weeks)}. Клацніть на день, щоб вибрати страви.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={selected.active}
                  disabled={!canEdit}
                  onChange={(e) => saveTemplate(selected.id, { active: e.target.checked }).catch(() => undefined)}
                />
              }
              label="Використовується"
            />
            {canEdit && (
              <Tooltip title="Назва і кількість тижнів">
                <IconButton onClick={() => setDialog(selected)} aria-label="Редагувати шаблон"><EditOutlinedIcon /></IconButton>
              </Tooltip>
            )}
          </Paper>
          <TemplateEditor key={`${selected.id}/${selected.weeks}/${selected.items.length}`} template={selected} />
        </Box>
      )}
      <TemplateDialog open={dialog !== null} template={dialog && dialog !== 'new' ? dialog : null} onClose={() => setDialog(null)} />
    </Box>
  )
}
