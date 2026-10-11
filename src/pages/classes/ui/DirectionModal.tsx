import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material'
import { useClassesStore } from '../model/classesStore'
import { missedRuleLabels, missedRules, type MissedLessonRule } from '../../../shared/api'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").min(2, 'Мінімум 2 символи').max(100, 'Максимум 100 символів'),
  missedRule: yup.mixed<MissedLessonRule>().oneOf(missedRules).required("Обов'язкове поле"),
  isActive: yup.boolean().default(true),
})

type FormValues = yup.InferType<typeof schema>

const defaults: FormValues = { name: '', missedRule: 'no_charge', isActive: true }

export const DirectionModal = () => {
  const { isOpen, direction } = useClassesStore((s) => s.directionModal)
  const setDirectionModal = useClassesStore((s) => s.setDirectionModal)
  const saveDirection = useClassesStore((s) => s.saveDirection)
  const isSaving = useClassesStore((s) => s.isSaving)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: defaults,
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (isOpen) {
      reset(direction ? { name: direction.name, missedRule: direction.missedRule, isActive: direction.isActive } : defaults)
    }
  }, [isOpen, direction, reset])

  const handleClose = () => {
    reset(defaults)
    setDirectionModal({ isOpen: false, direction: null })
  }

  const onSubmit = async (values: FormValues) => {
    await saveDirection(
      { name: values.name.trim(), missedRule: values.missedRule, isActive: values.isActive },
      direction?.id,
    )
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{direction ? 'Редагувати напрям' : 'Новий напрям'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="missedRule"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} select label="Правило пропусків" fullWidth error={!!error} helperText={error?.message}>
              {missedRules.map((key) => (
                <MenuItem key={key} value={key}>{missedRuleLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />
        {direction && (
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="Активний"
              />
            )}
          />
        )}
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
