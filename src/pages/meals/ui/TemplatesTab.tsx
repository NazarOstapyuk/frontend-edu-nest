import { useState } from 'react'
import { Alert, Box, Button, IconButton, List, ListItemButton, ListItemText, Paper, Switch, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useMealsStore } from '../model/mealsStore'
import { TemplateDialog } from './TemplateDialog'
import { TemplateEditor } from './TemplateEditor'
import type { MenuTemplate } from '../../../shared/api'

export const TemplatesTab = () => {
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
        Не вдалося завантажити дані.
      </Alert>
    )
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 240 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Шаблони</Typography>
          <IconButton size="small" onClick={() => setDialog('new')}><AddIcon /></IconButton>
        </Box>
        <List dense>
          {templates.length === 0 && <Typography color="text.secondary" sx={{ px: 2, pb: 1 }}>Шаблонів ще немає.</Typography>}
          {templates.map((t) => (
            <ListItemButton key={t.id} selected={selected?.id === t.id} onClick={() => setSelectedId(t.id)} sx={{ opacity: t.active ? 1 : 0.5 }}>
              <ListItemText primary={t.name} secondary={`${t.weeks} тиж.`} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
      {selected && (
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{selected.name}</Typography>
            <IconButton size="small" onClick={() => setDialog(selected)}><EditOutlinedIcon fontSize="small" /></IconButton>
            <Switch checked={selected.active} onChange={(e) => saveTemplate(selected.id, { active: e.target.checked }).catch(() => undefined)} />
          </Box>
          <TemplateEditor key={`${selected.id}/${selected.weeks}/${selected.items.length}`} template={selected} />
        </Box>
      )}
      <TemplateDialog open={dialog !== null} template={dialog && dialog !== 'new' ? dialog : null} onClose={() => setDialog(null)} />
    </Box>
  )
}
