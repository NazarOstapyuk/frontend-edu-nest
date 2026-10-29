import { useForm, useWatch, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { usePackagesStore } from '../model/packagesStore'
import { formatMoney, localToday } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  directionId: yup.string().required("Обов'язкове поле"),
  tariffId: yup.string().required("Обов'язкове поле"),
  purchaseDate: yup.string().required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

export const BuyPackageModal = () => {
  const isPhone = useIsPhone()
  const open = usePackagesStore((s) => s.buyOpen)
  const setOpen = usePackagesStore((s) => s.setBuyOpen)
  const directions = usePackagesStore((s) => s.directions)
  const tariffs = usePackagesStore((s) => s.tariffs)
  const purchase = usePackagesStore((s) => s.purchase)
  const isSaving = usePackagesStore((s) => s.isSaving)
  const activeDirections = directions.filter((d) => d.isActive)

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { directionId: '', tariffId: '', purchaseDate: localToday() },
    resolver: yupResolver(schema),
  })
  const directionId = useWatch({ control, name: 'directionId' })
  const allPackageTariffs = tariffs.filter((t) => t.unit === 'package' && t.isActive)
  const tariffsOf = (id: string) => {
    const linked = new Set(
      (directions.find((d) => d.id === id)?.groups ?? [])
        .filter((g) => g.isActive && g.packageTariff)
        .map((g) => g.packageTariff!.id),
    )
    const own = allPackageTariffs.filter((t) => linked.has(t.id))
    return own.length > 0 ? own : allPackageTariffs
  }
  const packageTariffs = directionId ? tariffsOf(directionId) : []

  const selectDirection = (id: string) => {
    const options = tariffsOf(id)
    setValue('tariffId', options.length === 1 ? options[0].id : '', { shouldValidate: options.length === 1 })
  }

  const handleClose = () => {
    reset({ directionId: '', tariffId: '', purchaseDate: localToday() })
    setOpen(false)
  }

  const onSubmit = async (values: FormValues) => {
    await purchase(values)
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Купити пакет</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="directionId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              onChange={(e) => {
                field.onChange(e)
                selectDirection(e.target.value)
              }}
              select
              label="Напрям"
              fullWidth
              error={!!error}
              helperText={error?.message}
            >
              {activeDirections.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="tariffId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              select
              label="Тариф пакета"
              fullWidth
              disabled={!directionId}
              error={!!error}
              helperText={error?.message ?? (directionId ? undefined : 'Спершу оберіть напрям')}
            >
              {packageTariffs.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                  {t.currentPrice ? ` — ${formatMoney(t.currentPrice)}` : ''}
                  {t.packageSize ? `, ${t.packageSize} зан.` : ''}
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
