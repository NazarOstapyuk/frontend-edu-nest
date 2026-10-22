import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material'
import { useInstitutionsStore } from '../model/institutionsStore'
import { institutionTypeLabels, type InstitutionType, type UpdateInstitutionDto } from '../../../shared/api'

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Мінімум 2 символи')
    .max(100, 'Максимум 100 символів')
    .required("Обов'язкове поле"),
  type: yup.mixed<InstitutionType>().oneOf(['kindergarten', 'school_class']).required("Обов'язкове поле"),
  isActive: yup.boolean().required(),
})

type FormValues = yup.InferType<typeof schema>

export const EditInstitutionModal = () => {
  const updateInstitution = useInstitutionsStore((s) => s.updateInstitution)
  const isUpdating = useInstitutionsStore((s) => s.isUpdating)
  const { isOpen, institution } = useInstitutionsStore((s) => s.editInstitutionModal)
  const setEditInstitutionModal = useInstitutionsStore((s) => s.setEditInstitutionModal)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', type: 'kindergarten', isActive: true },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (institution) {
      reset({ name: institution.name, type: institution.type, isActive: institution.isActive })
    }
  }, [institution, reset])

  const handleClose = () => {
    reset()
    setEditInstitutionModal({ isOpen: false, institution: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!institution) return
    const dto: UpdateInstitutionDto = {}
    if (values.name !== institution.name) dto.name = values.name
    if (values.type !== institution.type) dto.type = values.type
    if (values.isActive !== institution.isActive) dto.isActive = values.isActive
    if (Object.keys(dto).length > 0) await updateInstitution(institution.id, dto)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Редагувати заклад</DialogTitle>
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

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
              label="Активний"
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isUpdating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
