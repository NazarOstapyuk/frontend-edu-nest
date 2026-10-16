import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Box, Button, Paper, Typography } from '@mui/material'
import { onlinePaymentsApi } from '../../../shared/api'

const sameOriginUrl = (value: string | null): string | null => {
  if (!value) return null
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? url.href : null
  } catch {
    return null
  }
}

export const TestBankPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [searchParams] = useSearchParams()
  const [isSending, setIsSending] = useState(false)
  const [done, setDone] = useState(false)

  const send = async (result: 'success' | 'failure') => {
    if (!invoiceId) return
    setIsSending(true)
    try {
      await onlinePaymentsApi.testResult(invoiceId, result)
      const target = sameOriginUrl(searchParams.get('return'))
      if (target) {
        window.location.assign(target)
        return
      }
      setDone(true)
    } catch {
      setIsSending(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'grey.50' }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 4, width: '100%', maxWidth: 420 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Тестовий банк</Typography>
          {done ? (
            <>
              <Typography>Готово, поверніться на сайт</Typography>
              <Button component={Link} to="/" variant="contained">На сайт</Button>
            </>
          ) : (
            <>
              <Typography color="text.secondary">Це імітація сторінки оплати</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={() => send('success')} disabled={isSending}>Оплатити</Button>
                <Button variant="outlined" color="error" onClick={() => send('failure')} disabled={isSending}>Відхилити</Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
