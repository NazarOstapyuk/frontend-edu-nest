import { useState } from 'react'
import { Box, Button, Dialog, DialogTitle, Typography } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { InstitutionMultiSelect } from './InstitutionMultiSelect'
import { addDaysIso, formatDay } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

export const MenuPeriodDialog = ({ mode, onClose }: { mode: 'publish' | 'unpublish'; onClose: () => void }) => {
  const isPhone = useIsPhone()
  const current = useMealsStore((s) => s.menuInstitutionId)
  const start = useMealsStore((s) => s.menuStart)
  const weeks = useMealsStore((s) => s.menuWeeks)
  const isSaving = useMealsStore((s) => s.isSaving)
  const publishPeriod = useMealsStore((s) => s.publishPeriod)
  const unpublishPeriod = useMealsStore((s) => s.unpublishPeriod)
  const [ids, setIds] = useState<string[]>([current])
  const publishing = mode === 'publish'

  const submit = () => (publishing ? publishPeriod(ids) : unpublishPeriod(ids)).then(onClose).catch(() => undefined)

  return (
    <Dialog fullScreen={isPhone} open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{publishing ? 'Опублікувати період' : 'Зняти публікацію'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Typography variant="body2" color="text.secondary">
          {formatDay(start)} – {formatDay(addDaysIso(start, weeks * 7 - 1))}
        </Typography>
        <InstitutionMultiSelect label="Заклади" value={ids} onChange={setIds} currentId={current} />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={submit} variant="contained" disabled={isSaving || ids.length === 0} sx={{ width: '100%' }}>
            {publishing ? 'Опублікувати' : 'Зняти'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
