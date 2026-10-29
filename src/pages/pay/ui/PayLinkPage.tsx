import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Paper, Typography } from '@mui/material'
import { financeCategoryLabels, formatMoney, onlinePaymentsApi, type PublicLink } from '../../../shared/api'

const POLL_MS = 3000
const POLL_LIMIT = 20

const flagKey = (token: string) => `payLink:${token}`

const readFlag = (token: string) => {
  try {
    return sessionStorage.getItem(flagKey(token)) === '1'
  } catch {
    return false
  }
}

const writeFlag = (token: string, on: boolean) => {
  try {
    if (on) sessionStorage.setItem(flagKey(token), '1')
    else sessionStorage.removeItem(flagKey(token))
  } catch {
    return
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const closedTexts = {
  paid: 'Сплачено. Дякуємо!',
  cancelled: 'Посилання скасоване',
  expired: 'Посилання прострочене',
} as const

export const PayLinkPage = () => {
  const { token } = useParams<{ token: string }>()
  const [link, setLink] = useState<PublicLink | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [processing, setProcessing] = useState(() => (token ? readFlag(token) : false))
  const [isSending, setIsSending] = useState(false)

  const load = useCallback(async () => {
    if (!token) return null
    try {
      const { data } = await onlinePaymentsApi.publicLink(token)
      setLink(data)
      setLoadFailed(false)
      return data
    } catch (error) {
      if ((error as { statusCode?: unknown } | null)?.statusCode === 404) setInvalid(true)
      else setLoadFailed(true)
      return null
    }
  }, [token])

  useEffect(() => {
    onlinePaymentsApi
      .config()
      .then(({ data }) => setEnabled(data.enabled))
      .catch(() => setEnabled(false))
  }, [])

  const retry = () => {
    setLoadFailed(false)
    load()
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const run = async () => {
      const shouldPoll = readFlag(token)
      for (let attempt = 0; attempt < (shouldPoll ? POLL_LIMIT : 1); attempt += 1) {
        if (attempt > 0) await sleep(POLL_MS)
        if (cancelled) return
        const data = await load()
        if (cancelled) return
        if (!data || data.status !== 'open') break
      }
      if (cancelled) return
      writeFlag(token, false)
      setProcessing(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token, load])

  const pay = async () => {
    if (!token) return
    setIsSending(true)
    try {
      const { data } = await onlinePaymentsApi.payLink(token)
      writeFlag(token, true)
      window.location.assign(data.pageUrl)
    } catch {
      setIsSending(false)
      load()
    }
  }

  let body
  if (invalid) {
    body = <Typography>Посилання недійсне</Typography>
  } else if (loadFailed && !link) {
    body = (
      <>
        <Typography>Не вдалося завантажити дані.</Typography>
        <Button variant="outlined" onClick={retry}>Спробувати ще</Button>
      </>
    )
  } else if (!link) {
    body = <Typography color="text.secondary">Завантаження…</Typography>
  } else if (link.status !== 'open') {
    body = (
      <>
        <Typography sx={{ fontWeight: 700 }}>{closedTexts[link.status]}</Typography>
        <Typography color="text.secondary">Оплата за: {financeCategoryLabels[link.category]}</Typography>
      </>
    )
  } else if (processing) {
    body = <Typography>Оплата обробляється…</Typography>
  } else {
    body = (
      <>
        <Typography>Оплата за: {financeCategoryLabels[link.category]}</Typography>
        <Typography>Дитина: {link.payer}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatMoney(link.amount)}</Typography>
        {enabled ? (
          <Button variant="contained" size="large" fullWidth onClick={pay} disabled={isSending}>Оплатити</Button>
        ) : (
          <Typography color="text.secondary">Онлайн-оплата тимчасово недоступна</Typography>
        )}
      </>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'grey.50' }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { xs: 2.5, sm: 4 }, width: '100%', maxWidth: 420 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{link?.institution ?? 'EduNest'}</Typography>
          {body}
        </Box>
      </Paper>
    </Box>
  )
}
