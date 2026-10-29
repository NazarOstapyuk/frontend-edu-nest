import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material'
import type { BellSchedule, Group, MealPriceCategory, UpdateGroupDto } from '../../../shared/api'
import type { User } from '../../../entities/user'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  name: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  institutionId: yup.string().required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
  bellScheduleId: yup.string().default(''),
  mealPriceCategoryId: yup.string().default(''),
})

type FormValues = yup.InferType<typeof schema>

interface EditGroupModalProps {
  isOpen: boolean
  group: Group | null
  isSubmitting: boolean
  users: User[]
  bellSchedules: BellSchedule[]
  mealCategories: MealPriceCategory[]
  title?: string
  onSubmit: (id: string, dto: UpdateGroupDto) => Promise<unknown>
  onClose: () => void
}

export const EditGroupModal = ({
  isOpen,
  group,
  isSubmitting,
  users,
  bellSchedules,
  mealCategories,
  title = 'Редагувати групу',
  onSubmit: submit,
  onClose,
}: EditGroupModalProps) => {

  const isPhone = useIsPhone()

  const allInstitutions = useInstitutionStore((s) => s.institutions)
  const institutions = useEffectiveInstitutions()
  const loadInstitutions = useInstitutionStore((s) => s.load)

  useEffect(() => {
    if (isOpen && allInstitutions.length === 0) loadInstitutions().catch(() => undefined)
  }, [isOpen, allInstitutions.length, loadInstitutions])

  const teachers = users.filter((u) => u.role === 'teacher')

  const options = institutions.filter(
    (i) => i.type === group?.institution.type && (i.isActive || i.id === group?.institution.id),
  )

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', institutionId: '', teacherIds: [], bellScheduleId: '', mealPriceCategoryId: '' },
    resolver: yupResolver(schema),
  })
  const kind = group?.kind

  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        institutionId: group.institution.id,
        teacherIds: group.teachers.map((t) => t.id),
        bellScheduleId: group.bellScheduleId ?? '',
        mealPriceCategoryId: group.mealPriceCategoryId ?? '',
      })
    }
  }, [group, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    if (!group) return
    await submit(group.id, { name: values.name, institutionId: values.institutionId, teacherIds: values.teacherIds ?? [],
      bellScheduleId: kind === 'school_class' && values.bellScheduleId ? values.bellScheduleId : null,
      mealPriceCategoryId: values.mealPriceCategoryId || null,
    })
    handleClose()
  }

  return (
    <Dialog fullScreen={isPhone} open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Назва"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="institutionId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Заклад" fullWidth error={!!error} helperText={error?.message}>
              {options.map((i) => (
                <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="teacherIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={teachers}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
              value={teachers.filter((t) => field.value?.includes(t.id))}
              onChange={(_, selected) => field.onChange(selected.map((t) => t.id))}
              renderInput={(params) => <TextField {...params} label="Вчителі" />}
            />
          )}
        />

        {kind === 'school_class' && (
          <Controller
            name="bellScheduleId"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Розклад дзвінків" fullWidth>
                <MenuItem value="">Не обрано</MenuItem>
                {bellSchedules.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            )}
          />
        )}

        <Controller
          name="mealPriceCategoryId"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Цінова категорія харчування" fullWidth>
              <MenuItem value="">Не обрано</MenuItem>
              {mealCategories
                .filter((c) => c.active || c.id === field.value)
                .map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
