import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useChildrenStore } from '../model/childrenStore'
import { useUsersStore } from '../../users/model/usersStore'
import { useGroupsStore } from '../../groups/model/groupsStore'

const schema = yup.object({
  firstName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  lastName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  birthDate: yup.string().required("Обов'язкове поле"),
  groupId: yup.string().required("Обов'язкове поле"),
  parentIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const CreateChildModal = () => {
  const createChild = useChildrenStore((s) => s.createChild)
  const isCreating = useChildrenStore((s) => s.isCreating)
  const { isOpen } = useChildrenStore((s) => s.createChildModal)
  const setCreateChildModal = useChildrenStore((s) => s.setCreateChildModal)
  const users = useUsersStore((s) => s.users)
  const groups = useGroupsStore((s) => s.groups)

  const parents = users.filter((u) => u.role === 'parent')

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { firstName: '', lastName: '', birthDate: '', groupId: '', parentIds: [] },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    setCreateChildModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createChild({
      firstName: values.firstName,
      lastName: values.lastName,
      birthDate: values.birthDate,
      groupId: values.groupId,
      parentIds: values.parentIds ?? [],
    })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий учень</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Прізвище"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Ім'я"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Дата народження"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="groupId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              options={groups}
              getOptionLabel={(option) => option.name}
              value={groups.find((g) => g.id === field.value) ?? null}
              onChange={(_, selected) => field.onChange(selected?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Група"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}
        />

        <Controller
          name="parentIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={parents}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
              value={parents.filter((p) => field.value?.includes(p.id))}
              onChange={(_, selected) => field.onChange(selected.map((p) => p.id))}
              renderInput={(params) => <TextField {...params} label="Батьки" />}
            />
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
