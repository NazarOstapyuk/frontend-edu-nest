import { useForm, Controller, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, IconButton, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { DENOMINATIONS, denominationLabel, formatMoney, toKopecks } from '../../../shared/api'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { brandColors } from '../../../shared/assets/brand'
import { useCashStore } from '../model/cashStore'
import { differenceInfo, formatKopecks, signedMoney } from '../model/cashFormat'

const MAX_COUNT = 100000
const countPattern = /^\d{0,6}$/

const countValue = (value: string | undefined) => (value && countPattern.test(value) ? Number(value) : 0)

const totalKopecks = (counts: (string | undefined)[]) =>
  DENOMINATIONS.reduce((sum, key, index) => sum + Number(key) * countValue(counts[index]), 0)

interface CountContext {
  expectedKopecks: number
}

const schema = yup.object({
  counts: yup
    .array()
    .of(
      yup
        .string()
        .default('')
        .matches(countPattern, 'Ціле число')
        .test('max', 'Забагато', (value) => countValue(value) <= MAX_COUNT),
    )
    .required(),
  note: yup
    .string()
    .trim()
    .default('')
    .max(500, 'Максимум 500 символів')
    .test('required-on-difference', 'Поясніть розбіжність (щонайменше 5 символів)', function (value) {
      const { counts } = this.parent as { counts: string[] }
      const { expectedKopecks } = (this.options.context ?? { expectedKopecks: 0 }) as CountContext
      if (totalKopecks(counts) === expectedKopecks) return true
      return (value ?? '').trim().length >= 5
    }),
})

type FormValues = yup.InferType<typeof schema>

const makeDefaults = (): FormValues => ({
  counts: DENOMINATIONS.map(() => ''),
  note: '',
})

const SummaryRow = ({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: bold ? 900 : 700, color, textAlign: 'right' }}>
      {value}
    </Typography>
  </Box>
)

export const CountDialog = () => {
  const isPhone = useIsPhone()
  const { isOpen, mode, desk } = useCashStore((s) => s.countDialog)
  const setCountDialog = useCashStore((s) => s.setCountDialog)
  const openShift = useCashStore((s) => s.openShift)
  const closeShift = useCashStore((s) => s.closeShift)
  const isCreating = useCashStore((s) => s.isCreating)
  const isUpdating = useCashStore((s) => s.isUpdating)
  const push = useNotifyStore((s) => s.push)

  const shift = desk?.openShift ?? null
  const expected = mode === 'close' ? (shift?.expected ?? '0') : (desk?.lastClosed?.closingCounted ?? '0')
  const expectedKopecks = toKopecks(expected)

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: makeDefaults(),
    resolver: yupResolver(schema),
    context: { expectedKopecks },
  })
  const counts = useWatch({ control, name: 'counts' }) ?? []
  const counted = totalKopecks(counts)
  const difference = counted - expectedKopecks
  const diff = differenceInfo(difference)

  const handleClose = () => {
    reset(makeDefaults())
    setCountDialog({ isOpen: false, desk: null })
  }

  const step = (index: number, delta: number) => {
    const next = Math.min(MAX_COUNT, Math.max(0, countValue(counts[index]) + delta))
    setValue(`counts.${index}`, next === 0 ? '' : String(next), { shouldValidate: true })
  }

  const onSubmit = async (values: FormValues) => {
    if (!desk) return
    const denominations: Record<string, number> = {}
    DENOMINATIONS.forEach((key, index) => {
      const count = countValue(values.counts[index])
      if (count > 0) denominations[key] = count
    })
    const note = values.note.trim() || undefined
    if (mode === 'open') {
      await openShift(desk.id, { denominations, note })
      push('Зміну відкрито', 'success')
    } else {
      if (!shift) return
      await closeShift(shift.id, { denominations, note })
      push('Зміну закрито', 'success')
    }
    handleClose()
  }

  const isSaving = mode === 'open' ? isCreating : isUpdating

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {mode === 'open' ? 'Відкрити зміну' : 'Закрити зміну'}: {desk?.name}
      </DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, px: '20px', pb: '20px' }}>
        <Typography variant="body2" color="text.secondary">
          {mode === 'open'
            ? 'Перерахуйте готівку в касі та вкажіть кількість купюр і монет кожного номіналу.'
            : 'Перерахуйте готівку перед закриттям. Після закриття зміну й операції змінити не можна.'}
        </Typography>

        {mode === 'close' && shift && (
          <Box sx={{ borderRadius: '16px', bgcolor: brandColors.tableHead, boxShadow: brandColors.outline, px: 2, py: 1.5 }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Підсумки зміни</Typography>
            <SummaryRow label="На початок зміни" value={formatMoney(shift.openingCounted)} />
            <SummaryRow label="Надходження" value={signedMoney(shift.totals.income, 1)} />
            <SummaryRow label="Видатки" value={signedMoney(shift.totals.expense, -1)} />
            <SummaryRow label="Передано" value={signedMoney(shift.totals.transfer, -1)} />
            {toKopecks(shift.totals.correction) !== 0 && (
              <SummaryRow label="Коригування" value={signedMoney(shift.totals.correction, 1)} />
            )}
            <SummaryRow label="Має бути в касі" value={formatMoney(shift.expected)} bold />
          </Box>
        )}

        <Box sx={{ borderRadius: '16px', boxShadow: brandColors.outline, overflow: 'hidden' }}>
          {DENOMINATIONS.map((key, index) => {
            const subtotal = Number(key) * countValue(counts[index])
            return (
              <Box
                key={key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 1.5 },
                  px: { xs: 1.5, sm: 2 },
                  py: 1,
                  '&:not(:last-of-type)': { borderBottom: `1px solid ${brandColors.hairline}` },
                }}
              >
                <Typography sx={{ fontWeight: 800, width: { xs: 64, sm: 80 }, flexShrink: 0 }}>
                  {denominationLabel(key)}
                </Typography>
                <IconButton
                  aria-label={`Менше: ${denominationLabel(key)}`}
                  onClick={() => step(index, -1)}
                  disabled={countValue(counts[index]) === 0}
                  sx={{ width: 40, height: 40, boxShadow: brandColors.outline }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Controller
                  name={`counts.${index}`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      size="small"
                      placeholder="0"
                      error={!!error}
                      slotProps={{
                        htmlInput: {
                          inputMode: 'numeric',
                          'aria-label': `Кількість: ${denominationLabel(key)}`,
                          style: { textAlign: 'center' },
                        },
                      }}
                      sx={{ width: { xs: 64, sm: 80 }, flexShrink: 0 }}
                    />
                  )}
                />
                <IconButton
                  aria-label={`Більше: ${denominationLabel(key)}`}
                  onClick={() => step(index, 1)}
                  sx={{ width: 40, height: 40, boxShadow: brandColors.outline }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{
                    ml: 'auto',
                    textAlign: 'right',
                    fontWeight: subtotal > 0 ? 700 : 400,
                    color: subtotal > 0 ? 'text.primary' : 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatKopecks(subtotal)}
                </Typography>
              </Box>
            )
          })}
        </Box>

        <Box sx={{ borderRadius: '16px', bgcolor: brandColors.oliveTint, color: brandColors.inkOnOlive, px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>Пораховано</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{formatKopecks(counted)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: brandColors.inkOnOliveSoft }}>
              {mode === 'open' ? 'Залишено при попередньому закритті' : 'Має бути в касі'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatKopecks(expectedKopecks)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: brandColors.inkOnOliveSoft }}>
              Різниця
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 900, color: difference === 0 ? 'inherit' : diff.color }}>
              {diff.text}
            </Typography>
          </Box>
        </Box>

        <Controller
          name="note"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label={difference === 0 ? 'Коментар' : 'Пояснення розбіжності'}
              required={difference !== 0}
              fullWidth
              multiline
              minRows={2}
              error={!!error}
              helperText={
                error?.message ??
                (difference !== 0 ? 'Розбіжність потрібно пояснити: керівник отримає сповіщення' : undefined)
              }
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            {mode === 'open' ? 'Відкрити зміну' : 'Закрити зміну'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
