import { Box, Button, IconButton, Paper, Switch, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { MealCourse } from '../../../shared/api'

interface NamedListProps {
  title: string
  hint: string
  addLabel: string
  emptyText: string
  items: MealCourse[]
  usage: (id: string) => string | null
  canEdit: boolean
  onAdd: () => void
  onEdit: (item: MealCourse) => void
  onToggle: (item: MealCourse, active: boolean) => void
}

export const NamedList = ({ title, hint, addLabel, emptyText, items, usage, canEdit, onAdd, onEdit, onToggle }: NamedListProps) => {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk'))

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2, py: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{hint}</Typography>
        </Box>
        {canEdit && <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>{addLabel}</Button>}
      </Box>
      {sorted.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>{emptyText}</Typography>
      ) : (
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {sorted.map((item) => (
            <Box
              component="li"
              key={item.id}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', opacity: item.active ? 1 : 0.55 }}
            >
              <Tooltip title="Порядок у списках">
                <Box
                  sx={{
                    minWidth: 28, height: 28, px: 0.75, borderRadius: 14, display: 'grid', placeItems: 'center',
                    bgcolor: 'grey.100', color: 'text.secondary', fontSize: 12, fontWeight: 600,
                  }}
                >
                  {item.sortOrder}
                </Box>
              </Tooltip>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{item.name}</Typography>
                {usage(item.id) && <Typography variant="caption" color="text.secondary">{usage(item.id)}</Typography>}
              </Box>
              <Tooltip title={item.active ? 'Активний' : 'Вимкнено'}>
                <Switch
                  size="small"
                  checked={item.active}
                  disabled={!canEdit}
                  onChange={(e) => onToggle(item, e.target.checked)}
                  slotProps={{ input: { 'aria-label': `${item.name}: активний` } }}
                />
              </Tooltip>
              {canEdit && (
                <IconButton size="small" onClick={() => onEdit(item)} aria-label={`Редагувати ${item.name}`}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  )
}
