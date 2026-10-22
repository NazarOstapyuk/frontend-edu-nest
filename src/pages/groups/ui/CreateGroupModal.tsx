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
import { useGroupsStore } from '../model/groupsStore'
import { useUsersStore } from '../../users/model/usersStore'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'

const schema = yup.object({
  name: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  institutionId: yup.string().required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
  bellScheduleId: yup.string().default(''),
  mealPriceCategoryId: yup.string().default(''),
})

type FormValues = yup.InferType<typeof schema>

export const CreateGroupModal = () => {
  const createGroup = useGroupsStore((s) => s.createGroup)
  const isCreating = useGroupsStore((s) => s.isCreating)
  const { isOpen } = useGroupsStore((s) => s.createGroupModal)
  const setCreateGroupModal = useGroupsStore((s) => s.setCreateGroupModal)
  const users = useUsersStore((s) => s.users)
  const bellSchedules = useGroupsStore((s) => s.bellSchedules)
  const mealCategories = useGroupsStore((s) => s.mealCategories)

  const allInstitutions = useInstitutionStore((s) => s.institutions)
  const institutions = useEffectiveInstitutions()
  const selectedId = useInstitutionStore((s) => s.selectedId)
  const loadInstitutions = useInstitutionStore((s) => s.load)

  useEffect(() => {
    if (isOpen && allInstitutions.length === 0) loadInstitutions().catch(() => undefined)
  }, [isOpen, allInstitutions.length, loadInstitutions])

  const teachers = users.filter((u) => u.role === 'teacher')

  const options = institutions.filter((i) => i.isActive)

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', institutionId: '', teacherIds: [], bellScheduleId: '', mealPriceCategoryId: '' },
    resolver: yupResolver(schema),
  })
  const institutionId = useWatch({ control, name: 'institutionId' })
  const kind = institutions.find((i) => i.id === institutionId)?.type

  useEffect(() => {
    if (isOpen && selectedId && institutions.some((i) => i.id === selectedId && i.isActive)) {
      setValue('institutionId', selectedId)
    }
  }, [isOpen, selectedId, institutions, setValue])

  const handleClose = () => {
    reset()
    setCreateGroupModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createGroup({ name: values.name, institutionId: values.institutionId, teacherIds: values.teacherIds ?? [],
      bellScheduleId: kind === 'school_class' && values.bellScheduleId ? values.bellScheduleId : undefined,
      mealPriceCategoryId: values.mealPriceCategoryId || undefined,
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Нова група</DialogTitle>
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
            disabled={isCreating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
