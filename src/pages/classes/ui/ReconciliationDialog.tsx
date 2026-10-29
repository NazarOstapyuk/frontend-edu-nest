import { useNavigate } from 'react-router-dom'
import { Button, Dialog, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography } from '@mui/material'
import { useClassesStore } from '../model/classesStore'
import { formatMoney } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'

export const ReconciliationDialog = () => {
  const open = useClassesStore((s) => s.reconciliationOpen)
  const setOpen = useClassesStore((s) => s.setReconciliationOpen)
  const items = useClassesStore((s) => s.reconciliation)
  const navigate = useNavigate()
  const isPhone = useIsPhone()

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Потребує звірки</DialogTitle>
      <Box sx={{ p: '20px' }}>
        {isPhone ? (
          <CardList
            items={items}
            getKey={(i) => i.id}
            renderCard={(item) => (
              <>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{item.child.lastName} {item.child.firstName}</Typography>
                <CardField label="Напрям">{item.directionName}</CardField>
                <CardField label="Залишок">{item.remaining} з {item.sessionsTotal}</CardField>
                <CardField label="Повна ціна">{formatMoney(item.totalPrice)}</CardField>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                  <Button onClick={() => navigate(`/finance/${item.child.id}`)}>Відкрити</Button>
                </Box>
              </>
            )}
          />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Учень</TableCell>
                <TableCell>Напрям</TableCell>
                <TableCell align="right">Залишок</TableCell>
                <TableCell align="right">Повна ціна</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.child.lastName} {item.child.firstName}</TableCell>
                  <TableCell>{item.directionName}</TableCell>
                  <TableCell align="right">{item.remaining} з {item.sessionsTotal}</TableCell>
                  <TableCell align="right">{formatMoney(item.totalPrice)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => navigate(`/finance/${item.child.id}`)}>
                      Відкрити
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button color="inherit" onClick={() => setOpen(false)}>Закрити</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
