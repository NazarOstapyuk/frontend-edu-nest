import { useState } from 'react'
import { Box, Button, IconButton, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useScheduleSetupStore, type NamedKind } from '../model/scheduleSetupStore'
import { NameDialog } from './NameDialog'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList } from '../../../shared/ui/CardList'
import { useCan } from '../../../entities/user'
import type { NamedItem } from '../../../shared/api'

const titles: Record<NamedKind, { add: string; edit: string; empty: string }> = {
  subject: { add: 'Додати предмет', edit: 'Предмет', empty: 'Предметів ще немає.' },
  room: { add: 'Додати кабінет', edit: 'Кабінет', empty: 'Кабінетів ще немає.' },
}

export const NamedTab = ({ kind }: { kind: NamedKind }) => {
  const isPhone = useIsPhone()
  const subjects = useScheduleSetupStore((s) => s.subjects)
  const rooms = useScheduleSetupStore((s) => s.rooms)
  const isSaving = useScheduleSetupStore((s) => s.isSaving)
  const createNamed = useScheduleSetupStore((s) => s.createNamed)
  const updateNamed = useScheduleSetupStore((s) => s.updateNamed)
  const canEdit = useCan('timetable', 'edit')
  const [editing, setEditing] = useState<NamedItem | 'new' | null>(null)
  const items = kind === 'subject' ? subjects : rooms

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>{titles[kind].add}</Button>}
      </Box>
      {isPhone ? (
        <CardList
          items={items}
          getKey={(item) => item.id}
          empty={<Typography color="text.secondary">{titles[kind].empty}</Typography>}
          renderCard={(item) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: item.active ? 1 : 0.5 }}>
              <Typography sx={{ fontWeight: 600, mr: 'auto', minWidth: 0, overflowWrap: 'anywhere' }}>{item.name}</Typography>
              <Switch checked={item.active} disabled={!canEdit} onChange={(e) => updateNamed(kind, item.id, { active: e.target.checked }).catch(() => undefined)} />
              {canEdit && <IconButton sx={{ width: 40, height: 40 }} onClick={() => setEditing(item)}><EditOutlinedIcon fontSize="small" /></IconButton>}
            </Box>
          )}
        />
      ) : (
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Назва</TableCell>
              <TableCell>Активний</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={3} sx={{ color: 'text.secondary' }}>{titles[kind].empty}</TableCell></TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} sx={{ opacity: item.active ? 1 : 0.5 }}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Switch checked={item.active} disabled={!canEdit} onChange={(e) => updateNamed(kind, item.id, { active: e.target.checked }).catch(() => undefined)} />
                  </TableCell>
                  <TableCell align="right">
                    {canEdit && <IconButton size="small" onClick={() => setEditing(item)}><EditOutlinedIcon fontSize="small" /></IconButton>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      )}
      <NameDialog
        open={editing !== null}
        title={titles[kind].edit}
        initial={editing && editing !== 'new' ? editing.name : ''}
        isSaving={isSaving}
        onClose={() => setEditing(null)}
        onSubmit={(name) => (editing && editing !== 'new' ? updateNamed(kind, editing.id, { name }) : createNamed(kind, name))}
      />
    </Box>
  )
}
