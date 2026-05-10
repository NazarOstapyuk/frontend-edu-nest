import {useState} from 'react'
import {FormProvider, useForm} from 'react-hook-form'
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {useNavigate} from 'react-router-dom'
import {Box, Button, IconButton, InputAdornment, Typography} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {useAuthStore} from '../../../entities/user'
import {RHFTextField} from '../../../shared/ui/RHFTextField'

const schema = yup.object({
    login: yup.string().required('Введіть логін'),
    password: yup.string().min(6, 'Мінімум 6 символів').required('Введіть пароль'),
})

type FormData = yup.InferType<typeof schema>

export const LoginPage = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const login = useAuthStore((s) => s.login)
    const isLoading = useAuthStore((s) => s.isLoading)

    const methods = useForm({
        mode: 'all',
        defaultValues: {
            login: '',
            password: '',
        },
        resolver: yupResolver(schema) ,
    });

    const onSubmit = async (data: FormData) => {
        try {
            await login(data)
            navigate('/')
        } catch (error) {
            const {message} = error as { message: string }
        }
    }

    return (
        <FormProvider {...methods}>
            <Box
                sx={{
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 3,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                        p: '40px 36px',
                        width: 400,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 0.5,
                        }}
                    >
                        <SchoolIcon sx={{color: '#fff', fontSize: 28}}/>
                    </Box>

                    <Typography variant="h6" sx={{fontWeight: 700, color: 'primary.main', lineHeight: 1}}>
                        EduNest
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mt: -1}}>
                        Вхід до системи
                    </Typography>

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

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={isLoading}
                        sx={{mt: 1}}
                        onClick={methods.handleSubmit(onSubmit)}
                    >
                        Увійти
                    </Button>
                </Box>
            </Box>
        </FormProvider>
    )
}
