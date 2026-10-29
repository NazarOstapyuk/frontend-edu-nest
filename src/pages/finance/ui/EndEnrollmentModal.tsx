import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'
import { useEnrollmentsStore } from '../model/enrollmentsStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  endDate: yup.string().required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

const localToday = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export const EndEnrollmentModal = () => {
  const isPhone = useIsPhone()
  const { isOpen, enrollment } = useEnrollmentsStore((s) => s.endEnrollmentModal)
  const setEndEnrollmentModal = useEnrollmentsStore((s) => s.setEndEnrollmentModal)
  const endEnrollment = useEnrollmentsStore((s) => s.endEnrollment)
  const isSaving = useEnrollmentsStore((s) => s.isSaving)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { endDate: localToday() },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset({ endDate: localToday() })
    setEndEnrollmentModal({ isOpen: false, enrollment: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!enrollment) return
    await endEnrollment(enrollment.id, values.endDate)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Завершити запис</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Typography variant="body2" color="text.secondary">
          {enrollment?.tariff.name}. Наступні періоди не нараховуватимуться. Якщо поточний період уже нараховано, натисніть «Перерахувати» біля нього — сума стане пропорційною до дати завершення.
        </Typography>
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
