import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField, Typography } from '@mui/material'
import { usePackagesStore } from '../model/packagesStore'
import {
  formatMoney,
  normalizeAmount,
  reconcileOutcomeLabels,
  toKopecks,
  type ReconcileOutcome,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const outcomes = Object.keys(reconcileOutcomeLabels) as ReconcileOutcome[]
const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/

const schema = yup.object({
  outcome: yup.mixed<ReconcileOutcome>().oneOf(outcomes).required("Обов'язкове поле"),
  paidAmount: yup.string().trim().default(''),
  note: yup.string().default('').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

const defaults: FormValues = { outcome: 'paid_full', paidAmount: '', note: '' }

export const ReconcileModal = () => {
  const isPhone = useIsPhone()
  const target = usePackagesStore((s) => s.reconcileTarget)
  const setTarget = usePackagesStore((s) => s.setReconcileTarget)
  const reconcile = usePackagesStore((s) => s.reconcile)
  const isSaving = usePackagesStore((s) => s.isSaving)

  const { control, handleSubmit, reset, watch, setError } = useForm<FormValues>({
    mode: 'all',
    defaultValues: defaults,
    resolver: yupResolver(schema),
  })
  const outcome = watch('outcome')
  const total = toKopecks(target?.legacyTotalPrice ?? '0')

  const handleClose = () => {
    reset(defaults)
    setTarget(null)
  }

  const onSubmit = async (values: FormValues) => {
    if (!target) return
    if (values.outcome === 'paid_partial') {
      const paid = toKopecks(values.paidAmount)
      if (!amountPattern.test(values.paidAmount) || paid <= 0 || paid >= total) {
        setError('paidAmount', { message: 'Сума має бути більшою за 0 і меншою за повну ціну' })
        return
      }
    }
    await reconcile(target.id, {
      outcome: values.outcome,
      paidAmount: values.outcome === 'paid_partial' ? normalizeAmount(values.paidAmount) : undefined,
      note: values.note.trim() || undefined,
    })
    handleClose()
  }

  return (
    <Dialog open={target !== null} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Звірка пакета</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Typography variant="body2" color="text.secondary">
          {target?.direction.name}: {target?.sessionsTotal} занять, повна ціна{' '}
          {formatMoney(target?.legacyTotalPrice ?? '0')}. Неоплачена частина стане боргом у фінансах.
        </Typography>
        <Controller
          name="outcome"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Результат звірки" fullWidth>
              {outcomes.map((key) => (
                <MenuItem key={key} value={key}>{reconcileOutcomeLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />
        {outcome === 'paid_partial' && (
          <Controller
            name="paidAmount"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Сплачено, грн" fullWidth error={!!error} helperText={error?.message} />
            )}
          />
        )}
        <Controller
          name="note"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Примітка" fullWidth multiline error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Підтвердити
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
