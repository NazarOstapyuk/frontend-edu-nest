import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, IconButton, TextField, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useScheduleSetupStore } from '../model/scheduleSetupStore'
import type { BellSchedule } from '../../../shared/api'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
  periods: yup
    .array()
    .of(
      yup.object({
        startTime: yup.string().matches(TIME, 'Формат ГГ:ХХ').required("Обов'язкове поле"),
        endTime: yup
          .string()
          .matches(TIME, 'Формат ГГ:ХХ')
          .required("Обов'язкове поле")
          .test('after', 'Кінець раніше за початок', function (v) {
            return !v || !this.parent.startTime || v > this.parent.startTime
          }),
      }),
    )
    .min(1, 'Додайте хоча б один урок')
    .required(),
})

type FormValues = yup.InferType<typeof schema>

const empty: FormValues = { name: '', periods: [{ startTime: '08:30', endTime: '09:15' }] }

export const BellScheduleModal = ({ open, schedule, onClose }: { open: boolean; schedule: BellSchedule | null; onClose: () => void }) => {
  const isPhone = useIsPhone()
  const saveBellSchedule = useScheduleSetupStore((s) => s.saveBellSchedule)
  const isSaving = useScheduleSetupStore((s) => s.isSaving)
  const { control, handleSubmit, reset } = useForm<FormValues>({ mode: 'all', defaultValues: empty, resolver: yupResolver(schema) })
  const { fields, append, remove } = useFieldArray({ control, name: 'periods' })

  useEffect(() => {
    if (!open) return
    reset(schedule ? { name: schedule.name, periods: schedule.periods.map((p) => ({ startTime: p.startTime, endTime: p.endTime })) } : empty)
  }, [open, schedule, reset])

  const submit = async (values: FormValues) => {
    await saveBellSchedule(schedule?.id ?? null, {
      name: values.name.trim(),
      periods: values.periods.map((p, i) => ({ number: i + 1, startTime: p.startTime, endTime: p.endTime })),
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{schedule ? 'Розклад дзвінків' : 'Новий розклад дзвінків'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => <TextField {...field} label="Назва" error={!!error} helperText={error?.message} />}
        />
        {fields.map((f, i) => (
          <Box key={f.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Typography sx={{ width: { xs: 40, sm: 64 }, flexShrink: 0, pt: 1 }}>{i + 1}-й</Typography>
            <Controller
              name={`periods.${i}.startTime`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField {...field} type="time" size="small" label="Початок" sx={{ flex: 1, minWidth: 0 }} slotProps={{ inputLabel: { shrink: true } }} error={!!error} helperText={error?.message} />
              )}
            />
            <Controller
              name={`periods.${i}.endTime`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField {...field} type="time" size="small" label="Кінець" sx={{ flex: 1, minWidth: 0 }} slotProps={{ inputLabel: { shrink: true } }} error={!!error} helperText={error?.message} />
              )}
            />
            <IconButton size="small" disabled={fields.length === 1} onClick={() => remove(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
          </Box>
        ))}
        <Button onClick={() => append({ startTime: '', endTime: '' })}>Додати урок</Button>
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit((v) => submit(v).catch(() => undefined))} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
