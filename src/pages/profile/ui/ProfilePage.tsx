import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useAuthStore } from '../../../entities/user'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { PasswordFields } from '../../../shared/ui/PasswordFields'
import { isValidPhone, normalizePhone } from '../../../shared/lib/phone'

const schema = yup.object({
  phone: yup
    .string()
    .default('')
    .test('phone', 'Формат +380XXXXXXXXX', (value) => !value || isValidPhone(normalizePhone(value))),
  email: yup.string().default('').email('Невірний email').max(200, 'Максимум 200 символів'),
})

type FormValues = yup.InferType<typeof schema>

export const ProfilePage = () => {
  const profile = useAuthStore((s) => s.profile)
  const updateContacts = useAuthStore((s) => s.updateContacts)
  const changePassword = useAuthStore((s) => s.changePassword)
  const push = useNotifyStore((s) => s.push)
  const isParent = profile?.role === 'parent'

  const { control, handleSubmit, reset, setError, formState } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { phone: '', email: '' },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (profile) reset({ phone: profile.phone ?? '', email: profile.email ?? '' })
  }, [profile, reset])

  if (!profile) return null

  const saveContacts = async (values: FormValues) => {
    const phone = values.phone ? normalizePhone(values.phone) : ''
    if (isParent && !phone) {
      setError('phone', { message: 'Для батьків потрібен телефон' })
      return
    }
    await updateContacts({ phone: phone || undefined, email: values.email.trim() || null })
    push('Контакти збережено', 'success')
  }

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
          {[profile.lastName, profile.firstName, profile.middleName].filter(Boolean).join(' ')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Логін: {profile.login}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Телефон" placeholder="+380671234567" fullWidth error={!!error} helperText={error?.message} />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Email" fullWidth error={!!error} helperText={error?.message} />
            )}
          />
          <Button variant="contained" disabled={formState.isSubmitting} onClick={handleSubmit((v) => saveContacts(v).catch(() => undefined))}>
            Зберегти контакти
          </Button>
        </Box>
      </Paper>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 3 }}>Зміна пароля</Typography>
        <PasswordFields
          submitLabel="Змінити пароль"
          onSubmit={async (current, next) => {
            await changePassword(current, next)
            push('Пароль змінено', 'success')
          }}
        />
      </Paper>
    </Box>
  )
}
