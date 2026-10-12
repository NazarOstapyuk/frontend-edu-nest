import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, TextField } from '@mui/material'

const schema = yup.object({
  currentPassword: yup.string().required("Обов'язкове поле"),
  newPassword: yup.string().min(8, 'Мінімум 8 символів').max(100, 'Максимум 100 символів').required("Обов'язкове поле"),
  repeatPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Паролі не збігаються')
    .required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

interface PasswordFieldsProps {
  submitLabel: string
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>
}

export const PasswordFields = ({ submitLabel, onSubmit }: PasswordFieldsProps) => {
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { currentPassword: '', newPassword: '', repeatPassword: '' },
    resolver: yupResolver(schema),
  })

  const submit = async (values: FormValues) => {
    await onSubmit(values.currentPassword, values.newPassword)
    reset()
  }

  const field = (name: keyof FormValues, label: string, autoComplete: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState: { error } }) => (
        <TextField {...f} type="password" label={label} autoComplete={autoComplete} fullWidth error={!!error} helperText={error?.message} />
      )}
    />
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {field('currentPassword', 'Поточний пароль', 'current-password')}
      {field('newPassword', 'Новий пароль', 'new-password')}
      {field('repeatPassword', 'Повторіть новий пароль', 'new-password')}
      <Button variant="contained" disabled={formState.isSubmitting} onClick={handleSubmit((v) => submit(v).catch(() => undefined))}>
        {submitLabel}
      </Button>
    </Box>
  )
}
