import { useEffect, useState } from 'react'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Dialog,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  Box,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { RHFTextField } from '../../../shared/ui/RHFTextField.tsx'
import { useUsersStore } from '../model/usersStore.ts'

const schema = yup.object({
  firstName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
  lastName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
  role: yup.string().required("Обов'язкове поле"),
  login: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
  password: yup.string().transform((v) => v === '' ? undefined : v).min(6, 'Мінімум 6 символів').optional(),
})

export const EditUserModal = () => {
  const updateUser = useUsersStore((s) => s.updateUser)
  const isUpdating = useUsersStore((s) => s.isUpdating)
  const { isOpen, user } = useUsersStore((s) => s.editUserModal)
  const setEditUserModal = useUsersStore((s) => s.setEditUserModal)

  const [showPassword, setShowPassword] = useState(false)

  const methods = useForm<any>({
    mode: 'all',
    defaultValues: {
      firstName: '',
      lastName: '',
      role: 'teacher',
      login: '',
      password: '',
    },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (user) {
      methods.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        login: user.login,
        password: '',
      })
    }
  }, [user, methods])

  const handleClose = () => {
    methods.reset()
    setEditUserModal({ isOpen: false, user: null })
  }

  const onSubmit = async (values) => {
    if (!user) return
    const dto = values.password
      ? values
      : { firstName: values.firstName, lastName: values.lastName, role: values.role, login: values.login }
    await updateUser(user.id, dto)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Редагувати користувача</DialogTitle>

      <FormProvider {...methods}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '20px' }}>
          <Box sx={{ display: 'flex', gap: '10px' }}>
            <RHFTextField
              name="firstName"
              control={methods.control}
              label="Ім'я"
              fullWidth
            />
            <RHFTextField
              name="lastName"
              control={methods.control}
              label="Прізвище"
              fullWidth
            />
          </Box>

          <Controller
            name="role"
            control={methods.control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                select
                label="Роль"
                fullWidth
                error={!!error}
                helperText={error?.message}
              >
                <MenuItem value="teacher">Педагог</MenuItem>
                <MenuItem value="parent">Батьки</MenuItem>
              </TextField>
            )}
          />

          <RHFTextField
            name="login"
            control={methods.control}
            label="Логін"
            fullWidth
          />

          <RHFTextField
            name="password"
            control={methods.control}
            label="Новий пароль (необов'язково)"
            fullWidth
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
              Скасувати
            </Button>
            <Button
              onClick={methods.handleSubmit(onSubmit)}
              variant="contained"
              disabled={isUpdating}
              sx={{ width: '100%' }}
            >
              Зберегти
            </Button>
          </Box>
        </Box>
      </FormProvider>
    </Dialog>
  )
}
