import { useNavigate } from 'react-router-dom'
import { Button, Dialog, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, Box } from '@mui/material'
import { useClassesStore } from '../model/classesStore'
import { formatMoney } from '../../../shared/api'

export const ReconciliationDialog = () => {
  const open = useClassesStore((s) => s.reconciliationOpen)
  const setOpen = useClassesStore((s) => s.setReconciliationOpen)
  const items = useClassesStore((s) => s.reconciliation)
  const navigate = useNavigate()

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>Потребує звірки</DialogTitle>
      <Box sx={{ p: '20px' }}>
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
    </Dialog>
  )
}
