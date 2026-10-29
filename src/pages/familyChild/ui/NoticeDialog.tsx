import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useChildAttendanceStore } from '../model/childAttendanceStore'
import { localToday } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const DAY_MS = 24 * 60 * 60 * 1000
const span = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1

const schema = yup.object({
  startDate: yup.string().required("Обов'язкове поле").test('future', 'Не раніше сьогодні', (v) => !!v && v >= localToday()),
  endDate: yup
    .string()
    .required("Обов'язкове поле")
    .test('after', 'Кінець раніше за початок', function (v) {
      return !!v && v >= this.parent.startDate
    })
    .test('length', 'Не більше 60 днів', function (v) {
      return !v || !this.parent.startDate || span(this.parent.startDate, v) <= 60
    }),
  reasonId: yup.string().required('Оберіть причину'),
  comment: yup.string().default('').max(500, 'Максимум 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

export const NoticeDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const isPhone = useIsPhone()
  const reasons = useChildAttendanceStore((s) => s.reasons)
  const isSaving = useChildAttendanceStore((s) => s.isSaving)
  const createNotice = useChildAttendanceStore((s) => s.createNotice)
  const empty: FormValues = { startDate: localToday(), endDate: localToday(), reasonId: '', comment: '' }

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: empty,
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset(empty)
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    await createNotice({
      startDate: values.startDate,
      endDate: values.endDate,
      reasonId: values.reasonId,
      comment: values.comment.trim() || undefined,
    })
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>Повідомити про відсутність</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="startDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} type="date" label="З дати" slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: localToday() } }} error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="endDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} type="date" label="По дату" slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: localToday() } }} error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="reasonId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Причина" error={!!error} helperText={error?.message}>
              {reasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
          )}
        />
        <Controller
          name="comment"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Коментар" multiline minRows={2} error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Надіслати</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
