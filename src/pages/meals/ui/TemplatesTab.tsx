import { useState } from 'react'
import {
  Alert, Box, Button, ButtonBase, FormControlLabel, IconButton, Paper, Switch, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined'
import { useMealsStore } from '../model/mealsStore'
import { TemplateDialog } from './TemplateDialog'
import { TemplateEditor } from './TemplateEditor'
import { ApplyTemplateDialog } from './ApplyTemplateDialog'
import { itemsSignature } from '../model/menuDay'
import { useCan } from '../../../entities/user'
import { brandColors } from '../../../shared/assets/brand'
import type { MenuTemplate } from '../../../shared/api'

const weeksLabel = (n: number) => (n === 1 ? '1 тиждень' : n < 5 ? `${n} тижні` : `${n} тижнів`)

const WORKDAYS = [1, 2, 3, 4, 5]

const filledSet = (t: MenuTemplate) => new Set(t.items.filter((i) => i.weekday <= 5).map((i) => `${i.week}/${i.weekday}`))

const TemplateCard = ({ template, selected, onSelect }: { template: MenuTemplate; selected: boolean; onSelect: () => void }) => {
  const filled = filledSet(template)
  const total = template.weeks * WORKDAYS.length
  const segments = Array.from({ length: template.weeks }, (_, w) => w + 1).flatMap((w) => WORKDAYS.map((d) => filled.has(`${w}/${d}`)))
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1,
        textAlign: 'left',
        borderRadius: 2,
        bgcolor: 'background.paper',
        px: 2,
        py: 1.75,
        opacity: template.active ? 1 : 0.7,
        boxShadow: selected ? (t) => `0 0 0 2px ${t.palette.primary.main}` : brandColors.outline,
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 900, flex: 1, minWidth: 0 }} noWrap>{template.name}</Typography>
        <Box
          component="span"
          sx={{
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 1,
            px: 0.9,
            py: 0.25,
            bgcolor: template.active ? brandColors.paidBg : brandColors.oliveTint,
            color: template.active ? brandColors.paidText : brandColors.navInk,
          }}
        >
          {template.active ? 'Активний' : 'Вимкнено'}
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
        {weeksLabel(template.weeks)} · заповнено {filled.size} з {total} днів
      </Typography>
      <Box sx={{ display: 'flex', gap: '3px' }} aria-hidden>
        {segments.map((on, i) => (
          <Box key={i} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: on ? 'primary.main' : brandColors.hairline }} />
        ))}
      </Box>
    </ButtonBase>
  )
}

export const TemplatesTab = () => {
  const canEdit = useCan('meals', 'edit')
  const templates = useMealsStore((s) => s.templates)
  const failed = useMealsStore((s) => s.templatesFailed)
  const loadTemplates = useMealsStore((s) => s.loadTemplates)
  const saveTemplate = useMealsStore((s) => s.saveTemplate)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [week, setWeek] = useState(1)
  const [dialog, setDialog] = useState<MenuTemplate | 'new' | null>(null)
  const [applying, setApplying] = useState(false)
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0] ?? null
  const shownWeek = selected ? Math.min(week, selected.weeks) : 1

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {canEdit && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => setDialog('new')}
            sx={{ justifyContent: 'flex-start', bgcolor: 'background.paper', borderColor: 'divider' }}
          >
            Новий шаблон
          </Button>
        )}
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selected?.id === t.id}
            onSelect={() => {
              setSelectedId(t.id)
              setWeek(1)
            }}
          />
        ))}
      </Box>

      {selected && (
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.75, px: 2, py: 1.75, borderRadius: 2 }}>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.25 }}>{selected.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                Меню на {weeksLabel(selected.weeks)}, що повторюється по колу
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={selected.active}
                  disabled={!canEdit}
                  onChange={(e) => saveTemplate(selected.id, { active: e.target.checked }).catch(() => undefined)}
                />
              }
              label="Використовується"
              sx={{ mr: 0 }}
            />
            {canEdit && (
              <>
                <IconButton
                  onClick={() => setDialog(selected)}
                  aria-label="Назва і кількість тижнів"
                  sx={{ width: 44, height: 44, bgcolor: 'background.default' }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <Button
                  color="inherit"
                  startIcon={<EventRepeatOutlinedIcon />}
                  disabled={!selected.active}
                  onClick={() => setApplying(true)}
                  sx={{
                    bgcolor: 'text.primary',
                    color: 'background.paper',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': { bgcolor: brandColors.inkOnOlive },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                  }}
                >
                  Заповнити меню з шаблону
                </Button>
              </>
            )}
          </Paper>
          <TemplateEditor
            key={`${selected.id}/${selected.weeks}/${itemsSignature(selected.items)}`}
            template={selected}
            week={shownWeek}
            onWeekChange={setWeek}
          />
        </Box>
      )}
      <TemplateDialog open={dialog !== null} template={dialog && dialog !== 'new' ? dialog : null} onClose={() => setDialog(null)} />
      {applying && selected && <ApplyTemplateDialog templateId={selected.id} onClose={() => setApplying(false)} />}
    </Box>
  )
}
