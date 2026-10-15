import { useEffect } from 'react'
import { Alert, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { canAccess, useAuthStore } from '../../../entities/user'
import { useBackupStatusStore } from '../model/backupStatusStore'

export const BackupBanner = () => {
  const profile = useAuthStore((s) => s.profile)
  const status = useBackupStatusStore((s) => s.status)
  const load = useBackupStatusStore((s) => s.load)
  const isStaff = canAccess(profile, 'backups', 'view')

  useEffect(() => {
    if (isStaff) load().catch(() => undefined)
  }, [isStaff, load])

  if (!isStaff || !status || (status.configured && !status.stale)) return null

  return (
    <Alert
      severity="warning"
      sx={{ mb: 3 }}
      action={
        <Button component={RouterLink} to="/backups" color="inherit" size="small">
          Відкрити
        </Button>
      }
    >
      {status.configured ? 'Остання резервна копія невдала або застаріла' : 'Резервні копії не налаштовані'}
    </Alert>
  )
}
