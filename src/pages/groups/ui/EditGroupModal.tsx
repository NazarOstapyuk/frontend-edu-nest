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
  TextField,
} from '@mui/material'
import { useGroupsStore } from '../model/groupsStore'
import { useUsersStore } from '../../users/model/usersStore'

const schema = yup.object({
  name: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const EditGroupModal = () => {
  const updateGroup = useGroupsStore((s) => s.updateGroup)
  const isUpdating = useGroupsStore((s) => s.isUpdating)
  const { isOpen, group } = useGroupsStore((s) => s.editGroupModal)
  const setEditGroupModal = useGroupsStore((s) => s.setEditGroupModal)
  const users = useUsersStore((s) => s.users)

  const teachers = users.filter((u) => u.role === 'teacher')

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', teacherIds: [] },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        teacherIds: group.teachers.map((t) => t.id),
      })
    }
  }, [group, reset])

  const handleClose = () => {
    reset()
    setEditGroupModal({ isOpen: false, group: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!group) return
    await updateGroup(group.id, { name: values.name, teacherIds: values.teacherIds ?? [] })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Редагувати групу</DialogTitle>
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

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isUpdating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
