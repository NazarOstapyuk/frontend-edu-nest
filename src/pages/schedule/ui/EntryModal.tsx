import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useScheduleStore } from '../model/scheduleStore'
import { weekParities, weekParityLabels, weekdayLabels, type TimetableEntry, type WeekParity } from '../../../shared/api'

const schema = yup.object({
  parity: yup.mixed<WeekParity>().oneOf(weekParities).required(),
  subjectId: yup.string().required('Оберіть предмет'),
  teacherId: yup.string().required('Оберіть вчителя'),
  roomId: yup.string().default(''),
  subgroupId: yup.string().default(''),
})

type FormValues = yup.InferType<typeof schema>

interface EntryModalProps {
  open: boolean
  weekday: number
  period: number
  entry: TimetableEntry | null
  onClose: () => void
  onSave: (entry: TimetableEntry) => void
  onDelete: () => void
}

export const EntryModal = ({ open, weekday, period, entry, onClose, onSave, onDelete }: EntryModalProps) => {
  const isPhone = useIsPhone()
  const subjects = useScheduleStore((s) => s.subjects)
  const rooms = useScheduleStore((s) => s.rooms)
  const teachers = useScheduleStore((s) => s.teachers)
  const subgroups = useScheduleStore((s) => s.subgroups)
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { parity: 'every', subjectId: '', teacherId: '', roomId: '', subgroupId: '' },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (!open) return
    reset({
      parity: entry?.parity ?? 'every',
      subjectId: entry?.subjectId ?? '',
      teacherId: entry?.teacherId ?? '',
      roomId: entry?.roomId ?? '',
      subgroupId: entry?.subgroupId ?? '',
    })
  }, [open, entry, reset])

  const submit = (values: FormValues) => {
    onSave({
      weekday,
      period,
      parity: values.parity,
      subjectId: values.subjectId,
      teacherId: values.teacherId,
      roomId: values.roomId || null,
      subgroupId: values.subgroupId || null,
    })
    onClose()
  }

  const select = (name: keyof FormValues, label: string, options: { id: string; label: string }[], optional = false) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField {...field} select label={label} error={!!error} helperText={error?.message}>
          {optional && <MenuItem value="">Не вказано</MenuItem>}
          {options.map((o) => <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>)}
        </TextField>
      )}
    />
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{weekdayLabels[weekday - 1]}, {period}-й урок</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        {select('subjectId', 'Предмет', subjects.filter((s) => s.active || s.id === entry?.subjectId).map((s) => ({ id: s.id, label: s.name })))}
        {select('teacherId', 'Вчитель', teachers.filter((t) => t.isActive || t.id === entry?.teacherId).map((t) => ({ id: t.id, label: `${t.lastName} ${t.firstName}` })))}
        {select('roomId', 'Кабінет', rooms.filter((r) => r.active || r.id === entry?.roomId).map((r) => ({ id: r.id, label: r.name })), true)}
        {select('subgroupId', 'Підгрупа', subgroups.filter((g) => g.active || g.id === entry?.subgroupId).map((g) => ({ id: g.id, label: g.name })), true)}
        {select('parity', 'Тижні', weekParities.map((p) => ({ id: p, label: weekParityLabels[p] })))}
        <Box sx={{ display: 'flex', gap: '10px' }}>
          {entry && (
            <Button color="error" onClick={() => { onDelete(); onClose() }} sx={{ width: '100%' }}>Видалити</Button>
          )}
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit(submit)} variant="contained" sx={{ width: '100%' }}>Готово</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
