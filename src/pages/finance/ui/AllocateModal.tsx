import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'
import { useChildFinanceStore } from '../model/childFinanceStore'
import { allocationItemSchema } from '../model/schemas'
import { AllocationTable } from './AllocationTable'
import {
  financeCategoryLabels,
  formatMoney,
  toAllocationItems,
  toKopecks,
  type SuggestionLine,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  allocations: yup.array().of(allocationItemSchema).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const AllocateModal = () => {
  const isPhone = useIsPhone()
  const childId = useChildFinanceStore((s) => s.finance?.child.id)
  const { isOpen, payment } = useChildFinanceStore((s) => s.allocateModal)
  const setAllocateModal = useChildFinanceStore((s) => s.setAllocateModal)
  const allocate = useChildFinanceStore((s) => s.allocate)
  const suggestAllocation = useChildFinanceStore((s) => s.suggestAllocation)
  const isSaving = useChildFinanceStore((s) => s.isSaving)
  const [lines, setLines] = useState<SuggestionLine[]>([])

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { allocations: [] },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (!isOpen || !payment || !childId) return
    let active = true
    suggestAllocation(childId, { amount: payment.free, category: payment.category ?? undefined })
      .then((data) => {
        if (!active) return
        setLines(data.lines)
        setValue(
          'allocations',
          data.lines.map((line) => ({
            chargeId: line.chargeId,
            amount: Number(line.suggestedAmount) > 0 ? line.suggestedAmount : '',
          })),
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isOpen, payment, childId, suggestAllocation, setValue])

  const total = toKopecks(payment?.free ?? '0')
  const distributed = watch('allocations').reduce((acc, item) => acc + toKopecks(item.amount), 0)
  const rest = total - distributed
  const isOver = (index: number, amount: string | undefined) =>
    toKopecks(amount ?? '') > toKopecks(lines[index]?.remaining ?? '0')
  const anyOver = watch('allocations').some((item, index) => isOver(index, item.amount))

  const handleClose = () => {
    reset({ allocations: [] })
    setLines([])
    setAllocateModal({ isOpen: false, payment: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!payment) return
    await allocate(payment.id, { allocations: toAllocationItems(values.allocations) })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Розподілити оплату</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        {payment && (
          <Typography variant="body2" color="text.secondary">
            {payment.reference || 'Без реквізиту'} ·{payment.category ? financeCategoryLabels[payment.category] : 'Без категорії'} ·
            вільна сума {formatMoney(payment.free)}
          </Typography>
        )}
        <AllocationTable
          lines={lines}
          renderAmountField={(index) => (
            <Controller
              name={`allocations.${index}.amount`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  size="small"
                  error={!!error || isOver(index, field.value)}
                  helperText={error?.message ?? (isOver(index, field.value) ? 'Більше за залишок' : undefined)}
                />
              )}
            />
          )}
        />
        <Typography variant="body2" sx={{ color: rest < 0 ? 'error.main' : 'text.secondary' }}>
          Розподілено {formatMoney(distributed / 100)} з {formatMoney(total / 100)}
          {rest < 0 && ' — більше, ніж вільна сума'}
        </Typography>
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSaving || rest < 0 || distributed === 0 || anyOver}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
