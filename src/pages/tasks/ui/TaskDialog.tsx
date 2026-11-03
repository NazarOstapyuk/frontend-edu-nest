import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import {
  addDaysIso,
  kyivNow,
  staffTaskRoleLabel,
  type AssignableUser,
  type GivenTask,
  type StaffTaskRole,
  type TaskPersonRole,
  type UpdateStaffTaskDto,
} from '../../../shared/api'
import { useAuthStore } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { matchesSearch } from '../../../shared/lib/search'
import { useTasksStore } from '../model/tasksStore'

const schema = yup.object({
  title: yup.string().trim().required("Обов'язкове поле").max(200, 'Максимум 200 символів'),
  description: yup.string().max(2000, 'Максимум 2000 символів').default(''),
  dueDate: yup.string().required("Обов'язкове поле").matches(/^\d{4}-\d{2}-\d{2}$/, 'Вкажіть дату'),
  dueTime: yup.string().required("Обов'язкове поле").matches(/^([01]\d|2[0-3]):[0-5]\d$/, 'Вкажіть час'),
  assigneeIds: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Оберіть хоча б одного виконавця')
    .max(200, 'Не більше 200 виконавців')
    .default([]),
})

type FormValues = yup.InferType<typeof schema>

type RoleFilter = 'all' | StaffTaskRole

const pad = (n: number) => String(n).padStart(2, '0')

const defaultDeadline = () => {
  const now = kyivNow()
  const hour = Math.floor(now.minutes / 60) + 1
  if (hour >= 24) return { dueDate: addDaysIso(now.date, 1), dueTime: '09:00' }
  return { dueDate: now.date, dueTime: `${pad(hour)}:00` }
}

const nowKey = () => {
  const now = kyivNow()
  return `${now.date}T${pad(Math.floor(now.minutes / 60))}:${pad(now.minutes % 60)}`
}

const personName = (p: { lastName: string; firstName: string }) => `${p.lastName} ${p.firstName}`

const emptyValues = (): FormValues => ({ title: '', description: '', ...defaultDeadline(), assigneeIds: [] })

const valuesOf = (task: GivenTask): FormValues => ({
  title: task.title,
  description: task.description ?? '',
  dueDate: task.dueDate,
  dueTime: task.dueTime,
  assigneeIds: task.assignees.map((a) => a.id),
})

export const TaskDialog = () => {
  const { isOpen, task } = useTasksStore((s) => s.taskDialog)
  const setTaskDialog = useTasksStore((s) => s.setTaskDialog)
  const assignable = useTasksStore((s) => s.assignable)
  const assignableLoaded = useTasksStore((s) => s.assignableLoaded)
  const loadAssignable = useTasksStore((s) => s.loadAssignable)
  const createTask = useTasksStore((s) => s.createTask)
  const updateTask = useTasksStore((s) => s.updateTask)
  const isCreating = useTasksStore((s) => s.isCreating)
  const isUpdating = useTasksStore((s) => s.isUpdating)
  const isRoot = useAuthStore((s) => s.profile?.role === 'root')
  const isPhone = useIsPhone()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [deadlineError, setDeadlineError] = useState<string | null>(null)
  const isSaving = isCreating || isUpdating

  const { control, handleSubmit, reset, setValue, getValues } = useForm<FormValues>({
    mode: 'all',
    defaultValues: emptyValues(),
    resolver: yupResolver(schema),
  })

  const assigneeIds = useWatch({ control, name: 'assigneeIds' })

  useEffect(() => {
    if (!isOpen) return
    reset(task ? valuesOf(task) : emptyValues())
    loadAssignable().catch(() => undefined)
  }, [isOpen, task, reset, loadAssignable])

  const options = useMemo<(Omit<AssignableUser, 'role'> & { role: TaskPersonRole })[]>(() => {
    const extra = (task?.assignees ?? [])
      .filter((a) => !assignable.some((u) => u.id === a.id))
      .map(({ id, firstName, lastName, middleName, role }) => ({ id, firstName, lastName, middleName, role }))
    return [...assignable, ...extra]
  }, [assignable, task])

  const visibleOptions = options.filter((o) => roleFilter === 'all' || o.role === roleFilter)
  const teachers = assignable.filter((u) => u.role === 'teacher')
  const removed = (task?.assignees ?? []).filter((a) => !assigneeIds.includes(a.id))

  const handleClose = () => {
    reset(emptyValues())
    setRoleFilter('all')
    setDeadlineError(null)
    setTaskDialog({ isOpen: false, task: null })
  }

  const selectAllTeachers = () => {
    const current = getValues('assigneeIds')
    const next = [...current, ...teachers.map((t) => t.id).filter((id) => !current.includes(id))]
    setValue('assigneeIds', next, { shouldValidate: true, shouldDirty: true })
  }

  const onSubmit = async (values: FormValues) => {
    const deadlineChanged = !task || task.dueDate !== values.dueDate || task.dueTime !== values.dueTime
    if (deadlineChanged && `${values.dueDate}T${values.dueTime}` <= nowKey()) {
      setDeadlineError('Термін має бути в майбутньому')
      return
    }
    setDeadlineError(null)
    const title = values.title.trim()
    const description = values.description.trim()
    try {
      if (task) {
        const dto: UpdateStaffTaskDto = {}
        if (title !== task.title) dto.title = title
        if (description !== (task.description ?? '')) dto.description = description || null
        if (deadlineChanged) {
          dto.dueDate = values.dueDate
          dto.dueTime = values.dueTime
        }
        const before = task.assignees.map((a) => a.id)
        const same = before.length === values.assigneeIds.length && values.assigneeIds.every((id) => before.includes(id))
        if (!same) dto.assigneeIds = values.assigneeIds
        if (Object.keys(dto).length > 0) await updateTask(task.id, dto)
      } else {
        await createTask({
          title,
          ...(description ? { description } : {}),
          dueDate: values.dueDate,
          dueTime: values.dueTime,
          assigneeIds: values.assigneeIds,
        })
      }
      handleClose()
    } catch {
      return
    }
  }

  return (
    <Dialog open={isOpen} onClose={isSaving ? undefined : handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{task ? 'Редагувати завдання' : 'Нове завдання'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Назва"
                fullWidth
                error={!!error}
                helperText={error?.message}
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Опис"
                fullWidth
                multiline
                minRows={2}
                error={!!error}
                helperText={error?.message}
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
            )}
          />
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Controller
              name="dueDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Дата"
                  fullWidth
                  error={!!error || !!deadlineError}
                  helperText={error?.message ?? deadlineError}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
            <Controller
              name="dueTime"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  type="time"
                  label="Час (Київ)"
                  fullWidth
                  error={!!error || !!deadlineError}
                  helperText={error?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {isRoot && (
              <TextField
                select
                size="small"
                label="Роль"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                sx={{ minWidth: { xs: '100%', sm: 200 } }}
              >
                <MenuItem value="all">Усі</MenuItem>
                <MenuItem value="admin">Адміністратори</MenuItem>
                <MenuItem value="teacher">Педагоги</MenuItem>
              </TextField>
            )}
            <Button
              size="small"
              onClick={selectAllTeachers}
              disabled={teachers.length === 0}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Вибрати всіх вчителів
            </Button>
          </Box>
          <Controller
            name="assigneeIds"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Autocomplete
                multiple
                disableCloseOnSelect
                loading={!assignableLoaded}
                loadingText="Завантаження…"
                noOptionsText="Нікого не знайдено"
                options={visibleOptions}
                limitTags={isPhone ? 3 : 8}
                getLimitTagsText={(more) => `+${more}`}
                getOptionLabel={personName}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                filterOptions={(list, state) =>
                  list.filter((o) => matchesSearch(state.inputValue, o.lastName, o.firstName, o.middleName))
                }
                value={options.filter((o) => field.value.includes(o.id))}
                onChange={(_, selected) => field.onChange(selected.map((o) => o.id))}
                onBlur={field.onBlur}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props
                  return (
                    <li key={key} {...rest}>
                      <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2">{personName(option)}</Typography>
                        {isRoot && (
                          <Typography variant="caption" color="text.secondary">{staffTaskRoleLabel(option.role)}</Typography>
                        )}
                      </Box>
                    </li>
                  )
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Виконавці"
                    placeholder="Пошук за ПІБ"
                    error={!!error}
                    helperText={error?.message ?? `Вибрано: ${field.value.length}`}
                  />
                )}
              />
            )}
          />
          {removed.length > 0 && (
            <Alert severity="warning">
              Буде вилучено: {removed.map(personName).join(', ')}. Їхня відмітка виконання зникне.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose} disabled={isSaving}>Скасувати</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSaving}>Зберегти</Button>
      </DialogActions>
    </Dialog>
  )
}
