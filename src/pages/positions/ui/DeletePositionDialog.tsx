import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { usePositionsPageStore } from '../model/positionsPageStore'

export const DeletePositionDialog = () => {
  const isPhone = useIsPhone()
  const { isOpen, position } = usePositionsPageStore((s) => s.deleteModal)
  const setDeleteModal = usePositionsPageStore((s) => s.setDeleteModal)
  const deletePosition = usePositionsPageStore((s) => s.deletePosition)
  const isDeleting = usePositionsPageStore((s) => s.isDeleting)

  const handleClose = () => setDeleteModal({ isOpen: false, position: null })

  const handleDelete = async () => {
    if (!position) return
    await deletePosition(position.id)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullScreen={isPhone} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Видалити посаду</DialogTitle>
      <DialogContent>
        <DialogContentText>Видалити посаду «{position?.name}»?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Скасувати
        </Button>
        <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
          Видалити
        </Button>
      </DialogActions>
    </Dialog>
  )
}
