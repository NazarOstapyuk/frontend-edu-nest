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
                        bgcolor: brandColors.olive,
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Typography
                        sx={{
                            position: 'absolute',
                            top: 32,
                            left: 40,
                            fontWeight: 800,
                            color: brandColors.inkOnOlive,
                        }}
                    >
                        {`${BRAND_NAME}, дитячий садок і школа`}
                    </Typography>
                    <Box
                        sx={{
                            position: 'absolute',
                            width: 520,
                            height: 520,
                            borderRadius: '50%',
                            bgcolor: brandColors.oliveLight,
                            bottom: -140,
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            width: 96,
                            height: 96,
                            borderRadius: '50%',
                            bgcolor: brandColors.orange,
                            top: '22%',
                            right: '14%',
                        }}
                    />
                    <Box
                        component="img"
                        src={mascotUrl}
                        alt=""
                        sx={{position: 'relative', width: 340, maxWidth: '75%', display: 'block'}}
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
                        maxWidth: 420,
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
                        sx={{width: '100%', maxWidth: 260, alignSelf: {xs: 'center', md: 'flex-start'}, display: 'block', mb: 2}}
                    />

                    <Box>
                        <Typography component="h1" sx={{fontSize: {xs: 26, sm: 34}, fontWeight: 900, lineHeight: 1.15, mb: 1}}>
                            Вхід для працівників і батьків
                        </Typography>
                        <Typography color="text.secondary">
                            Логін і пароль видає адміністрація закладу.
                        </Typography>
                    </Box>

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

                    <Typography variant="body2" color="text.secondary">
                        Забули пароль? Зверніться до адміністратора закладу, він видасть новий.
                    </Typography>
                </Box>
                </Box>
            </Box>
        </FormProvider>
    )
}
