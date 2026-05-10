import {useState} from 'react'
import {useForm, Controller, FormProvider} from 'react-hook-form'
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Stack,
    IconButton,
    InputAdornment,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import type {UserRole} from "../../../entities/user";
import {RHFTextField} from "../../../shared/ui/RHFTextField.tsx";
import {useUsersStore} from "../model/usersStore.ts";

interface FormValues {
    firstName: string
    lastName: string
    role: UserRole
    login: string
    password: string
}

const schema = yup.object({
    firstName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    lastName: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    role: yup.string().required("Обов'язкове поле"),
    login: yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле"),
    password: yup.string().min(6, 'Мінімум 6 символів').required("Обов'язкове поле"),
})

export const CreateUserModal = () => {
    const createUser = useUsersStore((s) => s.createUser)
    const {isOpen} = useUsersStore((s) => s.createUserModal)
    const setCreateUserModal = useUsersStore((s) => s.setCreateUserModal)

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const methods = useForm({
        mode: 'all',
        defaultValues: {
            firstName: '',
            lastName: '',
            role: 'teacher',
            login: '',
            password: '',
        },
        resolver: yupResolver(schema),
    });

    const handleClose = () => {
        methods.reset()
        setCreateUserModal({ isOpen: false })
    }

    const onSubmit = async (values) => {
        setIsLoading(true)
        try {
            await createUser(values)
            handleClose()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{fontWeight: 700}}>Новий користувач</DialogTitle>

            <FormProvider {...methods}>
                <DialogContent>
                    <Stack spacing={2.5} sx={{pt: 0.5}}>
                        <Stack direction="row" spacing={2}>
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
                        </Stack>

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
                    </Stack>
                </DialogContent>

                <DialogActions sx={{px: 3, pb: 2.5, gap: 1}}>
                    <Button onClick={handleClose} color="inherit">Скасувати</Button>
                    <Button
                        onClick={methods.handleSubmit(onSubmit)}
                        variant="contained"
                        disabled={isLoading}
                    >
                        Зберегти
                    </Button>
                </DialogActions>
            </FormProvider>
        </Dialog>
    )
}
