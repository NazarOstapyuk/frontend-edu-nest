import { Box, Button, IconButton, TextField, Typography } from '@mui/material'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import type { RoutineItem } from '../../../shared/api'

interface RoutineItemsEditorProps {
  value: RoutineItem[]
  onChange: (items: RoutineItem[]) => void
  error?: string | null
}

export const RoutineItemsEditor = ({ value, onChange, error }: RoutineItemsEditorProps) => {
  const patch = (index: number, change: Partial<RoutineItem>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...change } : item)))

  return (
    <Box>
      {value.map((item, index) => (
        <Box key={index} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, alignItems: 'flex-start' }}>
          <TextField
            size="small"
            type="time"
            label="з"
            value={item.startTime}
            onChange={(e) => patch(index, { startTime: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 130 }}
          />
          <TextField
            size="small"
            type="time"
            label="до"
            value={item.endTime}
            onChange={(e) => patch(index, { endTime: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 130 }}
          />
          <TextField
            size="small"
            label="що робимо"
            value={item.title}
            onChange={(e) => patch(index, { title: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 300 } }}
            sx={{ flex: '1 1 200px' }}
          />
          <IconButton aria-label="Видалити пункт" onClick={() => onChange(value.filter((_, i) => i !== index))}>
            <DeleteOutlinedIcon />
          </IconButton>
        </Box>
      ))}
      <Button size="small" onClick={() => onChange([...value, { startTime: value[value.length - 1]?.endTime ?? '', endTime: '', title: '' }])}>
        + Пункт
      </Button>
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
