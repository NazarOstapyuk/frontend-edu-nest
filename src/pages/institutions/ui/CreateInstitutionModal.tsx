import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useInstitutionsStore } from '../model/institutionsStore'
import { institutionTypeLabels, type InstitutionType } from '../../../shared/api'

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Мінімум 2 символи')
    .max(100, 'Максимум 100 символів')
    .required("Обов'язкове поле"),
  type: yup.mixed<InstitutionType>().oneOf(['kindergarten', 'school_class']).required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

export const CreateInstitutionModal = () => {
  const createInstitution = useInstitutionsStore((s) => s.createInstitution)
  const isCreating = useInstitutionsStore((s) => s.isCreating)
  const { isOpen } = useInstitutionsStore((s) => s.createInstitutionModal)
  const setCreateInstitutionModal = useInstitutionsStore((s) => s.setCreateInstitutionModal)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', type: 'kindergarten' },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    setCreateInstitutionModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createInstitution({ name: values.name, type: values.type })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий заклад</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" fullWidth error={!!error} helperText={error?.message} />
          )}
        />

        <Controller
          name="type"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Тип" fullWidth error={!!error} helperText={error?.message}>
              {(Object.keys(institutionTypeLabels) as InstitutionType[]).map((key) => (
                <MenuItem key={key} value={key}>{institutionTypeLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isCreating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
