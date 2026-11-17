import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { normalizeAmount, toKopecks } from '../../../shared/api'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useCashStore } from '../model/cashStore'

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
  largeAmount: yup
    .string()
    .trim()
    .required("Обов'язкове поле")
    .matches(amountPattern, 'Невірна сума')
    .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0),
  closeBy: yup.string().trim().required("Обов'язкове поле").matches(timePattern, 'Формат ГГ:ХХ, наприклад 19:00'),
})

type FormValues = yup.InferType<typeof schema>

const makeDefaults = (): FormValues => ({ name: '', largeAmount: '', closeBy: '19:00' })

export const DeskModal = () => {
  const isPhone = useIsPhone()
  const { isOpen, desk } = useCashStore((s) => s.deskModal)
  const setDeskModal = useCashStore((s) => s.setDeskModal)
  const createDesk = useCashStore((s) => s.createDesk)
  const updateDesk = useCashStore((s) => s.updateDesk)
  const isCreating = useCashStore((s) => s.isCreating)
  const isUpdating = useCashStore((s) => s.isUpdating)
  const push = useNotifyStore((s) => s.push)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: makeDefaults(),
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (!isOpen) return
    reset(desk ? { name: desk.name, largeAmount: desk.largeAmount, closeBy: desk.closeBy } : makeDefaults())
  }, [isOpen, desk, reset])

  const handleClose = () => {
    reset(makeDefaults())
    setDeskModal({ isOpen: false, desk: null })
  }

  const onSubmit = async (values: FormValues) => {
    const dto = {
      name: values.name.trim(),
      largeAmount: normalizeAmount(values.largeAmount),
      closeBy: values.closeBy.trim(),
    }
    if (desk) {
      await updateDesk(desk.id, dto)
      push('Касу оновлено', 'success')
    } else {
      await createDesk(dto)
      push('Касу додано', 'success')
    }
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 800 }}>{desk ? 'Редагувати касу' : 'Додати касу'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: '20px', pb: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" required fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="largeAmount"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Велика сума, грн"
              required
              fullWidth
              error={!!error}
              helperText={error?.message ?? 'Видача від цієї суми потрапляє в сповіщення керівнику'}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          )}
        />
        <Controller
          name="closeBy"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Закрити зміну до"
              required
              fullWidth
              error={!!error}
              helperText={error?.message ?? 'Після цього часу незакрита зміна потрапляє в сповіщення'}
              slotProps={{ htmlInput: { inputMode: 'numeric', placeholder: 'ГГ:ХХ' } }}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isCreating || isUpdating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
