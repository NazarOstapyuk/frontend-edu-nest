import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '@mui/material'
import { onlinePaymentsApi } from '../../../shared/api'

type Phase = 'processing' | 'success' | 'failure' | 'unknown'

const POLL_MS = 3000
const POLL_LIMIT = 20

const messages: Record<Phase, string> = {
  processing: 'Оплата обробляється…',
  success: 'Оплату зараховано',
  failure: 'Оплата не пройшла. Спробуйте ще',
  unknown: 'Статус ще не підтверджено. Оновіть сторінку пізніше',
}

const severities = { processing: 'info', success: 'success', failure: 'error', unknown: 'warning' } as const

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const PaymentReturnBanner = ({ invoiceId, onSuccess }: { invoiceId: string; onSuccess: () => void }) => {
  const [phase, setPhase] = useState<Phase>('processing')
  const [, setSearchParams] = useSearchParams()
  const onSuccessRef = useRef(onSuccess)

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    let cancelled = false

    const finish = (next: Phase) => {
      setPhase(next)
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.delete('invoice')
          return params
        },
        { replace: true },
      )
    }

    const run = async () => {
      for (let attempt = 0; attempt < POLL_LIMIT; attempt += 1) {
        if (attempt > 0) await sleep(POLL_MS)
        if (cancelled) return
        try {
          const { data } = await onlinePaymentsApi.invoiceStatus(invoiceId)
          if (cancelled) return
          if (data.status === 'success') {
            finish('success')
            onSuccessRef.current()
            return
          }
          if (data.status === 'failure' || data.status === 'expired') {
            finish('failure')
            return
          }
        } catch {
          if (!cancelled) finish('unknown')
          return
        }
      }
      if (!cancelled) finish('unknown')
    }

    run()
    return () => {
      cancelled = true
    }
  }, [invoiceId, setSearchParams])

  return (
    <Alert severity={severities[phase]} sx={{ mb: 2 }}>
      {messages[phase]}
    </Alert>
  )
}
