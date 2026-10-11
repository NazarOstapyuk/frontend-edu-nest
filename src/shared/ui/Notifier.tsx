import { Alert, Snackbar } from '@mui/material'
import { useNotifyStore } from '../model/notifyStore'

export const Notifier = () => {
  const notices = useNotifyStore((s) => s.notices)
  const dismiss = useNotifyStore((s) => s.dismiss)
  const current = notices[0]

  return (
    <Snackbar
      key={current?.id}
      open={Boolean(current)}
      autoHideDuration={5000}
      onClose={(_, reason) => {
        if (reason !== 'clickaway' && current) dismiss(current.id)
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {current ? (
        <Alert severity={current.severity} variant="filled" onClose={() => dismiss(current.id)} sx={{ width: '100%' }}>
          {current.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  )
}
