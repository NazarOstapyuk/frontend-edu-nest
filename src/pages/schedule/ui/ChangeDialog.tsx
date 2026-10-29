import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Alert, Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useScheduleStore } from '../model/scheduleStore'
import { conflictText, formatDay, type LessonChangeDto, type ScheduleSlot } from '../../../shared/api'

const schema = yup.object({
  mode: yup.string().default('replace'),
  period: yup.string().default('').when('mode', { is: 'extra', then: (s) => s.required('Оберіть урок') }),
  subgroupId: yup.string().default(''),
  subjectId: yup.string().default('').when('mode', { is: 'extra', then: (s) => s.required('Оберіть предмет') }),
  teacherId: yup.string().default('').when('mode', { is: 'extra', then: (s) => s.required('Оберіть вчителя') }),
  roomId: yup.string().default(''),
  reason: yup.string().trim().required('Вкажіть причину').max(500, 'Максимум 500 символів'),
}).test('replace-something', 'Оберіть, що замінити: предмет, вчителя або кабінет', function (value) {
  if (value.mode !== 'replace' || value.subjectId || value.teacherId || value.roomId) return true
  return this.createError({ path: 'subjectId', message: 'Оберіть предмет, вчителя або кабінет для заміни' })
})

type FormValues = yup.InferType<typeof schema>

interface ChangeDialogProps {
  mode: 'replace' | 'extra'
  date: string
  slot: ScheduleSlot | null
  onClose: () => void
}

export const ChangeDialog = ({ mode, date, slot, onClose }: ChangeDialogProps) => {
  const isPhone = useIsPhone()
  const subjects = useScheduleStore((s) => s.subjects)
  const teachers = useScheduleStore((s) => s.teachers)
  const rooms = useScheduleStore((s) => s.rooms)
  const subgroups = useScheduleStore((s) => s.subgroups)
  const periods = useScheduleStore((s) => s.weekData?.periods ?? null)
  const isSaving = useScheduleStore((s) => s.isSaving)
  const createChange = useScheduleStore((s) => s.createChange)
  const changeConflicts = useScheduleStore((s) => s.changeConflicts)
  const clearChangeConflicts = useScheduleStore((s) => s.clearChangeConflicts)
  const weekData = useScheduleStore((s) => s.weekData)
  const { control, handleSubmit, reset } = useForm<FormValues>({ mode: 'all', resolver: yupResolver(schema) })
  const extraSubgroupId = useWatch({ control, name: 'subgroupId' })
  const busyPeriods = new Set(
    (weekData?.days.find((d) => d.date === date)?.slots ?? [])
      .filter((s) => !s.cancelled && (!extraSubgroupId || !s.subgroupId || s.subgroupId === extraSubgroupId))
      .map((s) => s.period),
  )

  useEffect(() => {
    clearChangeConflicts()
    reset({ mode, period: slot ? String(slot.period) : '', subgroupId: '', subjectId: '', teacherId: '', roomId: '', reason: '' })
  }, [slot, mode, reset, clearChangeConflicts])

  const submit = async (values: FormValues) => {
    const dto: LessonChangeDto = {
      date,
      period: slot ? slot.period : Number(values.period),
      subgroupId: slot ? (slot.subgroupId ?? undefined) : values.subgroupId || undefined,
      type: mode,
      subjectId: values.subjectId || undefined,
      teacherId: values.teacherId || undefined,
      roomId: values.roomId || undefined,
      reason: values.reason.trim(),
    }
    await createChange(dto)
    clearChangeConflicts()
    onClose()
  }

  const select = (name: keyof FormValues, label: string, options: { id: string; label: string; disabled?: boolean }[]) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField {...field} select label={label} error={!!error} helperText={error?.message}>
          <MenuItem value="">{mode === 'replace' ? 'Без змін' : 'Не вказано'}</MenuItem>
          {options.map((o) => <MenuItem key={o.id} value={o.id} disabled={o.disabled}>{o.label}</MenuItem>)}
        </TextField>
      )}
    />
  )

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === 'replace' ? `Заміна: ${formatDay(date)}, ${slot?.period}-й урок` : `Додатковий урок: ${formatDay(date)}`}
      </DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        {changeConflicts.length > 0 && (
          <Alert severity="error">
            {changeConflicts.map((c, i) => <div key={i}>{conflictText(c)}</div>)}
          </Alert>
        )}
        {mode === 'extra' && select('period', 'Урок', (periods ?? []).map((p) => ({
          id: String(p.number),
          label: `${p.number}-й (${p.startTime}–${p.endTime})${busyPeriods.has(p.number) ? ' · зайнято' : ''}`,
          disabled: busyPeriods.has(p.number),
        })))}
        {mode === 'extra' && select('subgroupId', 'Підгрупа', subgroups.filter((g) => g.active).map((g) => ({ id: g.id, label: g.name })))}
        {select('subjectId', 'Предмет', subjects.filter((s) => s.active).map((s) => ({ id: s.id, label: s.name })))}
        {select('teacherId', 'Вчитель', teachers.filter((t) => t.isActive).map((t) => ({ id: t.id, label: `${t.lastName} ${t.firstName}` })))}
        {select('roomId', 'Кабінет', rooms.filter((r) => r.active).map((r) => ({ id: r.id, label: r.name })))}
        <Controller
          name="reason"
          control={control}
          render={({ field, fieldState: { error } }) => <TextField {...field} label="Причина" error={!!error} helperText={error?.message} />}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={() => { clearChangeConflicts(); onClose() }} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit((v) => submit(v).catch(() => undefined))} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Зберегти</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
