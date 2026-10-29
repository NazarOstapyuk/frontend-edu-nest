import {useEffect, useState} from 'react'
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
    Tooltip,
} from '@mui/material'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {useIsPhone} from "../../../shared/lib/useIsPhone.ts";
import {RHFTextField} from "../../../shared/ui/RHFTextField.tsx";
import {useAuthStore, defaultScope, type User} from "../../../entities/user";
import {canAssignPosition, usePositionsStore} from "../../../entities/position";
import type {AccessScope, CreateUserDto} from "../../../shared/api";
import {InstitutionScopeFields} from "./InstitutionScopeFields.tsx";
import {isValidPhone, normalizePhone} from "../../../shared/lib/phone.ts";

const schema = yup.object({
    firstName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    lastName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    position: yup.string().required('Оберіть посаду'),
    login: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    password: yup.string().min(6, 'Мінімум 6 символів').required("Обов'язкове поле"),
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

interface CreateUserModalProps {
    isOpen: boolean
    isSubmitting: boolean
    presetParent?: boolean
    onSubmit: (dto: CreateUserDto) => Promise<User>
    onClose: () => void
}

export const CreateUserModal = ({isOpen, isSubmitting, presetParent, onSubmit: createUser, onClose}: CreateUserModalProps) => {
    const isPhone = useIsPhone()
    const profile = useAuthStore((s) => s.profile)

    const [showPassword, setShowPassword] = useState(false)
    const positions = usePositionsStore((s) => s.positions)
    const loadPositions = usePositionsStore((s) => s.load)

    useEffect(() => {
        if (isOpen) loadPositions().catch(() => undefined)
    }, [isOpen, loadPositions])

    const methods = useForm({
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
            ...defaultScope(profile),
        },
        resolver: yupResolver(schema),
    });

    useEffect(() => {
        if (isOpen && presetParent) methods.setValue('position', 'parent', {shouldValidate: true})
    }, [isOpen, presetParent, methods])

    const position = useWatch({control: methods.control, name: 'position'})
    const phone = useWatch({control: methods.control, name: 'phone'})
    const loginDirty = !!methods.formState.dirtyFields.login

    useEffect(() => {
        if (position !== 'parent' || !phone || loginDirty) return
        const normalized = normalizePhone(phone)
        if (isValidPhone(normalized)) methods.setValue('login', normalized, {shouldValidate: true})
    }, [position, phone, loginDirty, methods])

    const generatePassword = () => {
        const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        const values = crypto.getRandomValues(new Uint32Array(10))
        methods.setValue('password', Array.from(values, (v) => alphabet[v % alphabet.length]).join(''), {
            shouldValidate: true,
            shouldDirty: true,
        })
        setShowPassword(true)
    }

    const handleClose = () => {
        methods.reset()
        onClose()
    }

    const onSubmit = async (values: yup.InferType<typeof schema>) => {
        const isStaff = values.position !== 'parent'
        await createUser({
            firstName: values.firstName,
            lastName: values.lastName,
            ...(values.position === 'parent' ? {role: 'parent' as const} : {positionId: values.position}),
            login: values.login,
            password: values.password,
            middleName: values.middleName.trim() || undefined,
            phone: values.phone ? normalizePhone(values.phone) : undefined,
            email: values.email.trim() || undefined,
            ...(isStaff
                ? {
                    accessScope: values.accessScope,
                    ...(values.accessScope === 'institutions' ? {institutionIds: values.institutionIds} : {}),
                }
                : {}),
        })
        handleClose()
    }

    return (
        <Dialog open={isOpen} onClose={handleClose} fullScreen={isPhone} fullWidth maxWidth="sm">
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
                            flexDirection: {xs: 'column', sm: 'row'},
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
                            name="position"
                            control={methods.control}
                            render={({field, fieldState: {error}}) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Посада"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                >
                                    {positions.map((p) => (
                                        <MenuItem key={p.id} value={p.id} disabled={!canAssignPosition(profile, p)}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="parent">Батьки</MenuItem>
                                </TextField>
                            )}
                        />

                        {position !== 'parent' && <InstitutionScopeFields control={methods.control}/>}

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
                                            <Tooltip title="Згенерувати пароль">
                                                <IconButton onClick={generatePassword}>
                                                    <AutorenewIcon/>
                                                </IconButton>
                                            </Tooltip>
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
                                disabled={isSubmitting}
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
