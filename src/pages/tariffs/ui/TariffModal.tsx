import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useTariffsStore } from '../model/tariffsStore'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'
import { useCanManageShared } from '../../../entities/user'
import { useCan } from '../../../entities/user'
import {
  billingModeLabels,
  financeCategoryLabels,
  formatMoney,
  localToday,
  normalizeAmount,
  tariffUnitLabels,
  toKopecks,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import { DateField } from '../../../shared/ui/DateField'
import { formatDay } from '../../../shared/lib/date'

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

const VALIDITY_HINT =
  'Скільки календарних днів пакет діє від дати покупки. Це не кількість занять. Порожньо — без терміну: пакет діє, доки не закінчаться заняття. Нове значення діє для нових пакетів.'

const ValidityField = ({
  value,
  disabled,
  onSave,
}: {
  value: number | null
  disabled: boolean
  onSave: (value: number | null) => Promise<void>
}) => {
  const initial = value === null ? '' : String(value)
  const [text, setText] = useState(initial)
  const trimmed = text.trim()
  const invalid = trimmed !== '' && !(/^\d+$/.test(trimmed) && Number(trimmed) >= 1 && Number(trimmed) <= 3650)
  const changed = trimmed !== initial
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
      <TextField
        label="Термін дії, днів"
        fullWidth
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        error={invalid}
        helperText={invalid ? 'Від 1 до 3650 днів або порожньо' : VALIDITY_HINT}
      />
      {changed && !disabled && (
        <Button
          variant="contained"
          disabled={invalid}
          onClick={() => onSave(trimmed === '' ? null : Number(trimmed)).catch(() => undefined)}
          sx={{ flexShrink: 0, mt: { sm: 0.5 } }}
        >
          Зберегти
        </Button>
      )}
    </Box>
  )
}

export const TariffModal = () => {
  const isPhone = useIsPhone()
  const { isOpen, tariffId } = useTariffsStore((s) => s.tariffModal)
  const tariffs = useTariffsStore((s) => s.tariffs)
  const setTariffModal = useTariffsStore((s) => s.setTariffModal)
  const addPrice = useTariffsStore((s) => s.addPrice)
  const updateTariff = useTariffsStore((s) => s.updateTariff)
  const isSaving = useTariffsStore((s) => s.isSaving)
  const canEdit = useCan('tariffs', 'edit')
  const tariff = tariffs.find((t) => t.id === tariffId) ?? null
  const allInstitutions = useInstitutionStore((s) => s.institutions)
  const institutions = useEffectiveInstitutions()
  const canShare = useCanManageShared()
  const loadInstitutions = useInstitutionStore((s) => s.load)
  const institutionOptions = institutions.filter((i) => i.isActive || i.id === tariff?.institutionId)

  useEffect(() => {
    if (isOpen && allInstitutions.length === 0) loadInstitutions().catch(() => undefined)
  }, [isOpen, allInstitutions.length, loadInstitutions])

  const { control, handleSubmit, reset } = useForm<PriceValues>({
    mode: 'all',
    defaultValues: { price: '', effectiveFrom: localToday() },
    resolver: yupResolver(priceSchema),
  })

  const handleClose = () => {
    reset({ price: '', effectiveFrom: localToday() })
    setTariffModal({ isOpen: false, tariffId: null })
  }

  const onAddPrice = async (values: PriceValues) => {
    if (!tariff) return
    await addPrice(tariff.id, { price: normalizeAmount(values.price), effectiveFrom: values.effectiveFrom })
    reset({ price: '', effectiveFrom: localToday() })
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{tariff?.name}</DialogTitle>
      {tariff && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
          <Typography variant="body2" color="text.secondary">
            {financeCategoryLabels[tariff.category]} · {tariffUnitLabels[tariff.unit]}
            {tariff.packageSize ? ` (${tariff.packageSize})` : ''}
            {tariff.unit === 'month' && ` · ${billingModeLabels[tariff.billingMode]}`}
          </Typography>
          {tariff.unit === 'package' && (
            <ValidityField
              key={`${tariff.id}-${tariff.validityDays ?? ''}`}
              value={tariff.validityDays}
              disabled={isSaving || !canEdit}
              onSave={(validityDays) => updateTariff(tariff.id, { validityDays })}
            />
          )}
          <TextField
            select
            label="Заклад"
            fullWidth
            value={tariff.institutionId ?? ''}
            disabled={isSaving || !canEdit || (!canShare && tariff.institutionId === null)}
            onChange={(e) => updateTariff(tariff.id, { institutionId: e.target.value || null })}
          >
            {(canShare || tariff.institutionId === null) && <MenuItem value="">Спільний для всіх закладів</MenuItem>}
            {institutionOptions.map((i) => (
              <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={tariff.isActive}
                disabled={isSaving || !canEdit}
                onChange={(e) => updateTariff(tariff.id, { isActive: e.target.checked })}
              />
            }
            label="Активний"
          />
          {isPhone ? (
            <CardList
              items={tariff.prices}
              getKey={(p) => p.id}
              renderCard={(p) => (
                <>
                  <CardField label="Діє з">
                    {formatDay(p.effectiveFrom)}
                  </CardField>
                  <CardField label="Ціна">{formatMoney(p.price)}</CardField>
                </>
              )}
            />
          ) : (
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
                  <TableCell>{formatDay(p.effectiveFrom)}</TableCell>
                  <TableCell align="right">{formatMoney(p.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          {canEdit && (
            <>
              <Typography sx={{ fontWeight: 600 }}>Нова ціна</Typography>
              <Typography variant="body2" color="text.secondary">
                Якщо на цю дату ціна вже є, її буде замінено. Уже створені нарахування не зміняться.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
                    <DateField
                      {...field}
                      label="Діє з"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Box>
            </>
          )}
          <Box sx={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
              Закрити
            </Button>
            {canEdit && (
              <Button onClick={handleSubmit(onAddPrice)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
                Зберегти ціну
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Dialog>
  )
}
