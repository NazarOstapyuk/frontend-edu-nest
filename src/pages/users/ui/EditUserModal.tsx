import { useEffect, useState } from 'react'
import { useForm, useWatch, Controller, FormProvider } from 'react-hook-form'
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
  Typography,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useIsPhone } from '../../../shared/lib/useIsPhone.ts'
import { RHFTextField } from '../../../shared/ui/RHFTextField.tsx'
import { useUsersStore } from '../model/usersStore.ts'
import { isValidPhone, normalizePhone } from '../../../shared/lib/phone.ts'
import type { AccessScope, UpdateUserDto } from '../../../shared/api'
import { useAuthStore, canChangeAccess } from '../../../entities/user'
import { canAssignPosition, usePositionsStore } from '../../../entities/position'
import { InstitutionScopeFields } from '../../../widgets/userForms'

const schema = yup.object({
  firstName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
  lastName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
  position: yup.string().required('Оберіть посаду'),
  login: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
  password: yup.string().transform((v) => v === '' ? undefined : v).min(6, 'Мінімум 6 символів').optional(),
  middleName: yup.string().default('').max(100, 'Максимум 100 символів'),
  phone: yup.string().default('').when('position', {
      is: 'parent',
      then: (s) => s.required('Для батьків потрібен телефон'),
  }).test('phone', 'Формат +380XXXXXXXXX', (value) => !value || isValidPhone(normalizePhone(value))),
  email: yup.string().default('').email('Невірний email').max(200, 'Максимум 200 символів'),
  accessScope: yup.mixed<AccessScope>().oneOf(['all', 'institutions']).required(),
  institutionIds: yup.array(yup.string().required()).default([]).when(['position', 'accessScope'], {
    is: (position: string, scope: AccessScope) => position !== 'parent' && scope === 'institutions',
    then: (s) => s.min(1, 'Оберіть хоча б один заклад'),
  }),
})

type FormValues = yup.InferType<typeof schema>

export const EditUserModal = () => {
  const isPhone = useIsPhone()
  const updateUser = useUsersStore((s) => s.updateUser)
  const applyScope = useUsersStore((s) => s.applyScope)
  const profile = useAuthStore((s) => s.profile)
  const isUpdating = useUsersStore((s) => s.isUpdating)
  const { isOpen, user } = useUsersStore((s) => s.editUserModal)
  const setEditUserModal = useUsersStore((s) => s.setEditUserModal)

  const [showPassword, setShowPassword] = useState(false)
  const positions = usePositionsStore((s) => s.positions)
  const loadPositions = usePositionsStore((s) => s.load)

  useEffect(() => {
    if (isOpen) loadPositions().catch(() => undefined)
  }, [isOpen, loadPositions])

  const methods = useForm<any>({
    mode: 'all',
    defaultValues: {
      firstName: '',
      lastName: '',
      position: '',
      login: '',
      password: '',
      middleName: '',
      phone: '',
      email: '',
      accessScope: 'all',
      institutionIds: [],
    },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (user) {
      methods.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.role === 'parent' ? 'parent' : (user.position?.id ?? ''),
        login: user.login,
        password: '',
        middleName: user.middleName ?? '',
        phone: user.phone ?? '',
        email: user.email ?? '',
        accessScope: user.accessScope ?? 'all',
        institutionIds: user.institutionIds ?? [],
      })
    }
  }, [user, methods])

  const handleClose = () => {
    methods.reset()
    setEditUserModal({ isOpen: false, user: null })
  }

  const position = useWatch({ control: methods.control, name: 'position' })
  const isStaffUser = !!user && user.role !== 'parent'
  const scopeEditable = !!user && !isStaffUser && position !== 'parent' && canChangeAccess(profile, user)

  const onSubmit = async (values: FormValues) => {
    if (!user) return
    const dto: UpdateUserDto = {
      firstName: values.firstName,
      lastName: values.lastName,
      ...(values.position === 'parent' ? { role: 'parent' as const } : isStaffUser ? {} : { positionId: values.position as string }),
      login: values.login,
      middleName: values.middleName.trim() || null,
      phone: values.phone ? normalizePhone(values.phone) : null,
      email: values.email.trim() || null,
    }
    if (values.password) dto.password = values.password
    const updated = await updateUser(user.id, dto)
    if (scopeEditable) await applyScope(updated, values.accessScope, values.institutionIds)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullScreen={isPhone} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Редагувати користувача</DialogTitle>

      <FormProvider {...methods}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '20px' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: '10px' }}>
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

          <RHFTextField
            name="middleName"
            control={methods.control}
            label="По батькові"
            fullWidth
          />

          <Controller
            name="position"
            control={methods.control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                select
                label={isStaffUser ? 'Перевести в батьки' : 'Посада'}
                fullWidth
                error={!!error}
                helperText={error?.message ?? (isStaffUser ? 'Посада й заклади змінюються кнопкою «Доступ» у списку' : undefined)}
              >
                {isStaffUser && user?.position ? (
                  <MenuItem value={user.position.id}>{user.position.name} (без змін)</MenuItem>
                ) : (
                  !isStaffUser &&
                  positions.map((p) => (
                    <MenuItem key={p.id} value={p.id} disabled={!canAssignPosition(profile, p)}>
                      {p.name}
                    </MenuItem>
                  ))
                )}
                <MenuItem value="parent">Батьки</MenuItem>
              </TextField>
            )}
          />

          {scopeEditable && <InstitutionScopeFields control={methods.control} assignedIds={user?.institutionIds ?? []} />}

          <RHFTextField
            name="phone"
            control={methods.control}
            label="Телефон"
            placeholder="+380671234567"
            fullWidth
          />

          <RHFTextField
            name="email"
            control={methods.control}
            label="Email"
            fullWidth
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

          <Typography variant="caption" color="text.secondary" sx={{ mt: '-15px' }}>
            Після зміни пароля користувач має задати свій при вході
          </Typography>

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
