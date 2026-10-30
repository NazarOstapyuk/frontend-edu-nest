import { useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useEnrollmentsStore } from '../model/enrollmentsStore'
import { tariffsForInstitution } from '../model/institutionTariffs'
import { useChildFinanceStore } from '../model/childFinanceStore'
import { billingModeLabels, billingModes, formatMoney, localToday, type BillingMode } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  tariffId: yup.string().required("Обов'язкове поле"),
  startDate: yup.string().required("Обов'язкове поле"),
  endDate: yup
    .string()
    .default('')
    .test('after-start', 'Кінець раніше за початок', function (value) {
      const { startDate } = this.parent as { startDate: string }
      return !value || !startDate || value >= startDate
    }),
  billingMode: yup.string().default(''),
  note: yup.string().default('').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

const makeDefaults = (): FormValues => ({ tariffId: '', startDate: localToday(), endDate: '', billingMode: '', note: '' })

export const CreateEnrollmentModal = () => {
  const isPhone = useIsPhone()
  const { isOpen } = useEnrollmentsStore((s) => s.createEnrollmentModal)
  const setCreateEnrollmentModal = useEnrollmentsStore((s) => s.setCreateEnrollmentModal)
  const tariffOptions = useEnrollmentsStore((s) => s.tariffOptions)
  const createEnrollment = useEnrollmentsStore((s) => s.createEnrollment)
  const isSaving = useEnrollmentsStore((s) => s.isSaving)
  const childInstitutionId = useChildFinanceStore((s) => s.finance?.child.institutionId ?? null)
  const monthlyTariffs = tariffsForInstitution(
    tariffOptions.filter((t) => t.unit === 'month' && t.isActive),
    childInstitutionId,
  )

  const { control, handleSubmit, reset, getValues, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: makeDefaults(),
    resolver: yupResolver(schema),
  })
  const tariffId = useWatch({ control, name: 'tariffId' })
  const selectedTariff = monthlyTariffs.find((t) => t.id === tariffId)

  useEffect(() => {
    if (isOpen && monthlyTariffs.length === 1 && !getValues('tariffId')) setValue('tariffId', monthlyTariffs[0].id)
  }, [isOpen, monthlyTariffs, getValues, setValue])

  const handleClose = () => {
    reset(makeDefaults())
    setCreateEnrollmentModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createEnrollment({
      tariffId: values.tariffId,
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      billingMode: values.billingMode ? (values.billingMode as BillingMode) : undefined,
      note: values.note.trim() || undefined,
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Записати на тариф</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="tariffId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Тариф" fullWidth error={!!error} helperText={error?.message}>
              {monthlyTariffs.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                  {t.currentPrice ? ` — ${formatMoney(t.currentPrice)}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Controller
            name="startDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Дата старту"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Дата завершення"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        </Box>
        <Controller
          name="billingMode"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Режим періоду" fullWidth error={!!error} helperText={error?.message}>
              <MenuItem value="">
                Як у тарифі{selectedTariff ? ` (${billingModeLabels[selectedTariff.billingMode]})` : ''}
              </MenuItem>
              {billingModes.map((key) => (
                <MenuItem key={key} value={key}>{billingModeLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />
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
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
