import { useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
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
import type { BellSchedule, CreateGroupDto, MealPriceCategory } from '../../../shared/api'
import type { User } from '../../../entities/user'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'

const schema = yup.object({
  name: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  institutionId: yup.string().required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
  bellScheduleId: yup.string().default(''),
  mealPriceCategoryId: yup.string().default(''),
})

type FormValues = yup.InferType<typeof schema>

interface CreateGroupModalProps {
  isOpen: boolean
  isSubmitting: boolean
  users: User[]
  bellSchedules: BellSchedule[]
  mealCategories: MealPriceCategory[]
  lockedInstitutionId?: string | null
  title?: string
  onSubmit: (dto: CreateGroupDto) => Promise<unknown>
  onClose: () => void
}

export const CreateGroupModal = ({
  isOpen,
  isSubmitting,
  users,
  bellSchedules,
  mealCategories,
  lockedInstitutionId,
  title = 'Нова група',
  onSubmit: submit,
  onClose,
}: CreateGroupModalProps) => {
  const allInstitutions = useInstitutionStore((s) => s.institutions)
  const institutions = useEffectiveInstitutions()
  const selectedId = useInstitutionStore((s) => s.selectedId)
  const loadInstitutions = useInstitutionStore((s) => s.load)

  useEffect(() => {
    if (isOpen && allInstitutions.length === 0) loadInstitutions().catch(() => undefined)
  }, [isOpen, allInstitutions.length, loadInstitutions])

  const teachers = users.filter((u) => u.role === 'teacher')

  const options = lockedInstitutionId
    ? allInstitutions.filter((i) => i.id === lockedInstitutionId)
    : institutions.filter((i) => i.isActive)

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', institutionId: '', teacherIds: [], bellScheduleId: '', mealPriceCategoryId: '' },
    resolver: yupResolver(schema),
  })
  const institutionId = useWatch({ control, name: 'institutionId' })
  const kind = allInstitutions.find((i) => i.id === institutionId)?.type

  useEffect(() => {
    if (!isOpen) return
    if (lockedInstitutionId) {
      setValue('institutionId', lockedInstitutionId)
    } else if (selectedId && institutions.some((i) => i.id === selectedId && i.isActive)) {
      setValue('institutionId', selectedId)
    }
  }, [isOpen, lockedInstitutionId, selectedId, institutions, setValue])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    await submit({ name: values.name, institutionId: values.institutionId, teacherIds: values.teacherIds ?? [],
      bellScheduleId: kind === 'school_class' && values.bellScheduleId ? values.bellScheduleId : undefined,
      mealPriceCategoryId: values.mealPriceCategoryId || undefined,
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
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
            <TextField
              {...field}
              select
              label="Заклад"
              fullWidth
              disabled={!!lockedInstitutionId}
              error={!!error}
              helperText={error?.message}
            >
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
