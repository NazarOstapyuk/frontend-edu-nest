import {useState} from 'react'
import {FormProvider, useForm} from 'react-hook-form'
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {useNavigate} from 'react-router-dom'
import {Box, Button, IconButton, InputAdornment, Typography} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {homePath, useAuthStore} from '../../../entities/user'
import {translateError} from '../../../shared/api'
import {RHFTextField} from '../../../shared/ui/RHFTextField'
import {BRAND_NAME, brandColors, logoUrl, mascotHeadUrl, mascotUrl} from '../../../shared/assets/brand'

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
            const profile = await login(data)
            navigate(homePath(profile))
        } catch (error) {
            methods.setError('password', {message: translateError(error)})
        }
    }

    return (
        <FormProvider {...methods}>
            <Box sx={{minHeight: '100vh', display: 'flex', bgcolor: 'background.paper'}}>
                <Box
                    sx={{
                        display: {xs: 'none', md: 'flex'},
                        flex: '0 0 44%',
                        bgcolor: brandColors.oliveDeep,
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            width: 460,
                            height: 460,
                            borderRadius: '50%',
                            bgcolor: brandColors.olive,
                            opacity: 0.35,
                        }}
                    />
                    <Box
                        component="img"
                        src={mascotUrl}
                        alt=""
                        sx={{position: 'relative', width: 300, maxWidth: '70%', display: 'block'}}
                    />
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                    }}
                >
                <Box
                    component="form"
                    noValidate
                    onSubmit={methods.handleSubmit(onSubmit)}
                    sx={{
                        p: {xs: 1, sm: 2},
                        width: '100%',
                        maxWidth: 380,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: 2,
                    }}
                >
                    <Box
                        component="img"
                        src={mascotHeadUrl}
                        alt=""
                        sx={{display: {xs: 'block', md: 'none'}, width: 88, height: 88, alignSelf: 'center'}}
                    />
                    <Box
                        component="img"
                        src={logoUrl}
                        alt={BRAND_NAME}
                        sx={{width: '100%', maxWidth: 300, alignSelf: 'center', display: 'block', mb: 2}}
                    />

                    <Typography variant="h5" component="h1">
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
                        type="submit"
                    >
                        Увійти
                    </Button>
                </Box>
                </Box>
            </Box>
        </FormProvider>
    )
}
