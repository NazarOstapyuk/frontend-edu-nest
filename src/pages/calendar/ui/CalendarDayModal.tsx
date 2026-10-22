import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useCalendarStore } from '../model/calendarStore'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import {
  calendarDayTypeLabels,
  calendarScopeLabels,
  type CalendarDayType,
  type CalendarScope,
} from '../../../shared/api'

const types = Object.keys(calendarDayTypeLabels) as CalendarDayType[]
const scopes = Object.keys(calendarScopeLabels) as CalendarScope[]

const schema = yup.object({
  startDate: yup.string().required("Обов'язкове поле"),
  endDate: yup
    .string()
    .default('')
    .test('after', 'Кінець раніше за початок', function (value) {
      return !value || value >= this.parent.startDate
    }),
  type: yup.mixed<CalendarDayType>().oneOf(types).required(),
  scope: yup.mixed<CalendarScope>().oneOf(scopes).required(),
  groupId: yup
    .string()
    .default('')
    .when('scope', { is: 'group', then: (s) => s.required('Оберіть групу') }),
  institutionId: yup
    .string()
    .default('')
    .when('scope', { is: 'institution', then: (s) => s.required('Оберіть заклад') }),
  title: yup.string().trim().required("Обов'язкове поле").max(200, 'Максимум 200 символів'),
})

type FormValues = yup.InferType<typeof schema>

const empty: FormValues = { startDate: '', endDate: '', type: 'non_working', scope: 'all', groupId: '', institutionId: '', title: '' }

export const CalendarDayModal = () => {
  const isOpen = useCalendarStore((s) => s.isModalOpen)
  const setModalOpen = useCalendarStore((s) => s.setModalOpen)
  const createEntry = useCalendarStore((s) => s.createEntry)
  const groups = useCalendarStore((s) => s.groups)
  const isSaving = useCalendarStore((s) => s.isSaving)

  const institutions = useInstitutionStore((s) => s.institutions)
  const selectedInstitutionId = useInstitutionStore((s) => s.selectedId)
  const loadInstitutions = useInstitutionStore((s) => s.load)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: empty,
    resolver: yupResolver(schema),
  })
  const scope = useWatch({ control, name: 'scope' })

  useEffect(() => {
    if (!isOpen) return
    reset({ ...empty, institutionId: selectedInstitutionId ?? '' })
    if (institutions.length === 0) void loadInstitutions().catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleClose = () => {
    reset(empty)
    setModalOpen(false)
  }

  const onSubmit = async (values: FormValues) => {
    await createEntry({
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      type: values.type,
      scope: values.scope,
      groupId: values.scope === 'group' ? values.groupId : undefined,
      institutionId: values.scope === 'institution' ? values.institutionId : undefined,
      title: values.title.trim(),
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий запис календаря</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="startDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} type="date" label="З дати" slotProps={{ inputLabel: { shrink: true } }} error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="endDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} type="date" label="По дату (необов'язково)" slotProps={{ inputLabel: { shrink: true } }} error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Тип">
              {types.map((t) => <MenuItem key={t} value={t}>{calendarDayTypeLabels[t]}</MenuItem>)}
            </TextField>
          )}
        />
        <Controller
          name="scope"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Для кого">
              {scopes.map((s) => <MenuItem key={s} value={s}>{calendarScopeLabels[s]}</MenuItem>)}
            </TextField>
          )}
        />
        {scope === 'group' && (
          <Controller
            name="groupId"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} select label="Група" error={!!error} helperText={error?.message}>
                {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </TextField>
            )}
          />
        )}
        {scope === 'institution' && (
          <Controller
            name="institutionId"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} select label="Заклад" error={!!error} helperText={error?.message}>
                {institutions.map((i) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
              </TextField>
            )}
          />
        )}
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" placeholder="Наприклад, Осінні канікули" error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Зберегти</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
