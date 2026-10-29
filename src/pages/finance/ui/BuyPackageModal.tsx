import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { usePackagesStore } from '../model/packagesStore'
import { formatMoney, localToday } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  option: yup.string().required("Обов'язкове поле"),
  purchaseDate: yup.string().required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

const optionKey = (directionId: string, tariffId: string) => `${directionId}:${tariffId}`

export const BuyPackageModal = () => {
  const isPhone = useIsPhone()
  const open = usePackagesStore((s) => s.buyOpen)
  const setOpen = usePackagesStore((s) => s.setBuyOpen)
  const directions = usePackagesStore((s) => s.directions)
  const tariffs = usePackagesStore((s) => s.tariffs)
  const purchase = usePackagesStore((s) => s.purchase)
  const isSaving = usePackagesStore((s) => s.isSaving)

  const options = directions
    .filter((d) => d.isActive)
    .flatMap((d) => {
      const tariffIds = [
        ...new Set(d.groups.filter((g) => g.isActive && g.packageTariff).map((g) => g.packageTariff!.id)),
      ]
      return tariffIds.flatMap((tariffId) => {
        const tariff = tariffs.find((t) => t.id === tariffId && t.unit === 'package' && t.isActive)
        return tariff ? [{ key: optionKey(d.id, tariff.id), directionId: d.id, direction: d.name, tariff }] : []
      })
    })
    .sort((a, b) => a.direction.localeCompare(b.direction, 'uk') || a.tariff.name.localeCompare(b.tariff.name, 'uk'))

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { option: '', purchaseDate: localToday() },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset({ option: '', purchaseDate: localToday() })
    setOpen(false)
  }

  const onSubmit = async (values: FormValues) => {
    const chosen = options.find((o) => o.key === values.option)
    if (!chosen) return
    await purchase({ directionId: chosen.directionId, tariffId: chosen.tariff.id, purchaseDate: values.purchaseDate })
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Купити пакет</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="option"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              select
              label="Пакет"
              fullWidth
              disabled={options.length === 0}
              error={!!error}
              helperText={
                error?.message ??
                (options.length === 0 ? 'Немає пакетів: вкажіть «Тариф пакета» в групах гуртків' : undefined)
              }
            >
              {options.map((o) => (
                <MenuItem key={o.key} value={o.key} sx={{ whiteSpace: 'normal' }}>
                  {o.direction} — {o.tariff.name}
                  {o.tariff.packageSize ? `, ${o.tariff.packageSize} зан.` : ''}
                  {o.tariff.currentPrice ? `, ${formatMoney(o.tariff.currentPrice)}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="purchaseDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Дата купівлі"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Купити
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
