import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useTariffsStore } from '../model/tariffsStore'
import {
  billingModeLabels,
  financeCategoryLabels,
  formatMoney,
  normalizeAmount,
  tariffUnitLabels,
  toKopecks,
} from '../../../shared/api'

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/

const priceSchema = yup.object({
  price: yup
    .string()
    .trim()
    .required("Обов'язкове поле")
    .matches(amountPattern, 'Невірна сума')
    .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0),
  effectiveFrom: yup.string().required("Обов'язкове поле"),
})

type PriceValues = yup.InferType<typeof priceSchema>

export const TariffModal = () => {
  const { isOpen, tariffId } = useTariffsStore((s) => s.tariffModal)
  const tariffs = useTariffsStore((s) => s.tariffs)
  const setTariffModal = useTariffsStore((s) => s.setTariffModal)
  const addPrice = useTariffsStore((s) => s.addPrice)
  const updateTariff = useTariffsStore((s) => s.updateTariff)
  const isSaving = useTariffsStore((s) => s.isSaving)
  const tariff = tariffs.find((t) => t.id === tariffId) ?? null

  const { control, handleSubmit, reset } = useForm<PriceValues>({
    mode: 'all',
    defaultValues: { price: '', effectiveFrom: '' },
    resolver: yupResolver(priceSchema),
  })

  const handleClose = () => {
    reset()
    setTariffModal({ isOpen: false, tariffId: null })
  }

  const onAddPrice = async (values: PriceValues) => {
    if (!tariff) return
    await addPrice(tariff.id, { price: normalizeAmount(values.price), effectiveFrom: values.effectiveFrom })
    reset()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{tariff?.name}</DialogTitle>
      {tariff && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
          <Typography variant="body2" color="text.secondary">
            {financeCategoryLabels[tariff.category]} · {tariffUnitLabels[tariff.unit]}
            {tariff.packageSize ? ` (${tariff.packageSize})` : ''} · {billingModeLabels[tariff.billingMode]}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={tariff.isActive}
                disabled={isSaving}
                onChange={(e) => updateTariff(tariff.id, { isActive: e.target.checked })}
              />
            }
            label="Активний"
          />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Діє з</TableCell>
                <TableCell align="right">Ціна</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tariff.prices.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.effectiveFrom).toLocaleDateString('uk-UA')}</TableCell>
                  <TableCell align="right">{formatMoney(p.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography sx={{ fontWeight: 600 }}>Нова ціна</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller
              name="price"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField {...field} label="Ціна, грн" fullWidth error={!!error} helperText={error?.message} />
              )}
            />
            <Controller
              name="effectiveFrom"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Діє з"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
              Закрити
            </Button>
            <Button onClick={handleSubmit(onAddPrice)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
              Додати ціну
            </Button>
          </Box>
        </Box>
      )}
    </Dialog>
  )
}
