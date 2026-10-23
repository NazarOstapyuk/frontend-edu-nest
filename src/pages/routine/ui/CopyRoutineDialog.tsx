import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import { kyivNow, routineApi } from '../../../shared/api'
import { useRoutineStore } from '../model/routineStore'

interface CopyRoutineDialogProps {
  open: boolean
  groupId: string
  onClose: () => void
  onCopied: () => void
}

const CopyForm = ({ groupId, onClose, onCopied }: Omit<CopyRoutineDialogProps, 'open'>) => {
  const groups = useRoutineStore((s) => s.groups)
  const manyInstitutions = new Set(groups.map((g) => g.institution.id)).size > 1
  const sources = groups.filter((g) => g.id !== groupId)
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? '')
  const [validFrom, setValidFrom] = useState(kyivNow().date)
  const [isSaving, setIsSaving] = useState(false)

  const onSubmit = async () => {
    setIsSaving(true)
    try {
      await routineApi.copy(groupId, sourceId, validFrom)
      onCopied()
    } catch {
      return
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogTitle>Скопіювати з іншої групи</DialogTitle>
      <DialogContent>
        <TextField
          select
          fullWidth
          size="small"
          label="З групи"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        >
          {sources.map((g) => (
            <MenuItem key={g.id} value={g.id}>{manyInstitutions ? `${g.name} · ${g.institution.name}` : g.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          size="small"
          type="date"
          label="Діє з"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving || !sourceId || !validFrom} onClick={onSubmit}>Скопіювати</Button>
      </DialogActions>
    </>
  )
}

export const CopyRoutineDialog = ({ open, ...rest }: CopyRoutineDialogProps) => (
  <Dialog open={open} onClose={rest.onClose} fullWidth maxWidth="xs">
    <CopyForm {...rest} />
  </Dialog>
)
