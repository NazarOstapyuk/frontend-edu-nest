import {useState} from 'react'
import {useForm, useWatch, Controller, FormProvider} from 'react-hook-form'
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
    Dialog,
    DialogTitle,
    Button,
    TextField,
    MenuItem,
    IconButton,
    InputAdornment, Box,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {RHFTextField} from "../../../shared/ui/RHFTextField.tsx";
import {useAuthStore, type UserRole} from "../../../entities/user";
import type {AccessScope} from "../../../shared/api";
import {defaultScope} from "../model/accessRules.ts";
import {InstitutionScopeFields} from "./InstitutionScopeFields.tsx";
import {useUsersStore} from "../model/usersStore.ts";
import {isValidPhone, normalizePhone} from "../../../shared/lib/phone.ts";

const schema = yup.object({
    firstName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    lastName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    role: yup.string().required("Обов'язкове поле"),
    login: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    password: yup.string().min(6, 'Мінімум 6 символів').required("Обов'язкове поле"),
    middleName: yup.string().default('').max(100, 'Максимум 100 символів'),
    phone: yup.string().default('').when('role', {
        is: 'parent',
        then: (s) => s.required('Для батьків потрібен телефон'),
    }).test('phone', 'Формат +380XXXXXXXXX', (value) => !value || isValidPhone(normalizePhone(value))),
    email: yup.string().default('').email('Невірний email').max(200, 'Максимум 200 символів'),
    accessScope: yup.mixed<AccessScope>().oneOf(['all', 'institutions']).required(),
    institutionIds: yup.array(yup.string().required()).default([]).when(['role', 'accessScope'], {
        is: (role: string, scope: AccessScope) => role !== 'parent' && scope === 'institutions',
        then: (s) => s.min(1, 'Оберіть хоча б один заклад'),
    }),
})

export const CreateUserModal = () => {
    const createUser = useUsersStore((s) => s.createUser)
    const applyScope = useUsersStore((s) => s.applyScope)
    const profile = useAuthStore((s) => s.profile)
    const isCreating = useUsersStore((s) => s.isCreating)
    const {isOpen} = useUsersStore((s) => s.createUserModal)
    const setCreateUserModal = useUsersStore((s) => s.setCreateUserModal)

    const [showPassword, setShowPassword] = useState(false)

    const methods = useForm({
        mode: 'all',
        defaultValues: {
            firstName: '',
            lastName: '',
            role: 'teacher',
            login: '',
            password: '',
            middleName: '',
            phone: '',
            email: '',
            ...defaultScope(profile),
        },
        resolver: yupResolver(schema),
    });

    const role = useWatch({control: methods.control, name: 'role'})

    const handleClose = () => {
        methods.reset()
        setCreateUserModal({ isOpen: false })
    }

    const onSubmit = async (values: yup.InferType<typeof schema>) => {
        const created = await createUser({
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role as UserRole,
            login: values.login,
            password: values.password,
            middleName: values.middleName.trim() || undefined,
            phone: values.phone ? normalizePhone(values.phone) : undefined,
            email: values.email.trim() || undefined,
        })
        handleClose()
        if (values.role !== 'parent') {
            await applyScope(created, values.accessScope, values.institutionIds).catch(() => undefined)
        }
    }

    return (
        <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{fontWeight: 700}}>Новий користувач</DialogTitle>

            <FormProvider {...methods}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '25px',
                        padding: '20px',
                    }}>
                        <Box sx={{
                            display: 'flex',
                            gap: '10px',
                        }}>
                            <RHFTextField
                                name="firstName"
                                control={methods.control}
                                label="Ім'я"
                                fullWidth
                                autoComplete="username"
                            />
                            <RHFTextField
                                name="lastName"
                                control={methods.control}
                                label="Прізвище"
                                fullWidth
                                autoComplete="username"
                            />
                        </Box>

                        <RHFTextField
                            name="middleName"
                            control={methods.control}
                            label="По батькові"
                            fullWidth
                        />

                        <Controller
                            name="role"
                            control={methods.control}
                            render={({field, fieldState: {error}}) => (
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

                        {role !== 'parent' && <InstitutionScopeFields control={methods.control}/>}

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
                            autoComplete="username"
                        />

                        <RHFTextField
                            name="password"
                            control={methods.control}
                            label="Пароль"
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                                                {showPassword ? <VisibilityOffIcon/> : <VisibilityIcon/>}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Box sx={{
                            display: 'flex',
                            gap: '10px',
                        }}>
                            <Button
                                onClick={handleClose}
                                color="inherit"
                                sx={{width: '100%'}}
                            >
                                Скасувати
                            </Button>
                            <Button
                                onClick={methods.handleSubmit(onSubmit)}
                                variant="contained"
                                disabled={isCreating}
                                sx={{width: '100%'}}
                            >
                                Зберегти
                            </Button>
                        </Box>
                    </Box>
            </FormProvider>
        </Dialog>
    )
}
