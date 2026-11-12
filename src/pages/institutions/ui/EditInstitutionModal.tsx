import { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { useInstitutionsStore } from '../model/institutionsStore'
import {
  institutionTypeLabels,
  type AssessmentLevel,
  type InstitutionType,
  type UpdateInstitutionDto,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Мінімум 2 символи')
    .max(100, 'Максимум 100 символів')
    .required("Обов'язкове поле"),
  type: yup.mixed<InstitutionType>().oneOf(['kindergarten', 'school_class']).required("Обов'язкове поле"),
  isActive: yup.boolean().required(),
  levels: yup
    .array()
    .of(
      yup.object({
        name: yup.string().trim().min(1, "Обов'язкове поле").max(50, 'Максимум 50 символів').required("Обов'язкове поле"),
        code: yup.string().trim().min(1, "Обов'язкове поле").max(5, 'Максимум 5 символів').required("Обов'язкове поле"),
        minPercent: yup
          .number()
          .typeError('Число від 0 до 100')
          .integer('Ціле число')
          .min(0, 'Від 0')
          .max(100, 'До 100')
          .required("Обов'язкове поле"),
      }),
    )
    .max(10, 'Не більше 10 рівнів')
    .test('distinct', 'Межі рівнів не можуть повторюватись', (rows) => {
      const bounds = (rows ?? []).map((r) => r.minPercent)
      return new Set(bounds).size === bounds.length
    })
    .required(),
})

type FormValues = yup.InferType<typeof schema>

const defaultLevels: AssessmentLevel[] = [
  { name: 'Високий', code: 'В', minPercent: 85 },
  { name: 'Достатній', code: 'Д', minPercent: 65 },
  { name: 'Середній', code: 'С', minPercent: 40 },
  { name: 'Початковий', code: 'П', minPercent: 0 },
]

const sameLevels = (a: AssessmentLevel[], b: AssessmentLevel[]) => JSON.stringify(a) === JSON.stringify(b)

export const EditInstitutionModal = () => {
  const isPhone = useIsPhone()
  const updateInstitution = useInstitutionsStore((s) => s.updateInstitution)
  const isUpdating = useInstitutionsStore((s) => s.isUpdating)
  const { isOpen, institution } = useInstitutionsStore((s) => s.editInstitutionModal)
  const setEditInstitutionModal = useInstitutionsStore((s) => s.setEditInstitutionModal)
  const fetchLevels = useInstitutionsStore((s) => s.fetchLevels)
  const saveLevels = useInstitutionsStore((s) => s.saveLevels)
  const [initialLevels, setInitialLevels] = useState<AssessmentLevel[] | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', type: 'kindergarten', isActive: true, levels: [] },
    resolver: yupResolver(schema),
  })
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'levels' })

  useEffect(() => {
    if (!institution || !isOpen) return
    let cancelled = false
    reset({ name: institution.name, type: institution.type, isActive: institution.isActive, levels: [] })
    fetchLevels(institution.id)
      .then((levels) => {
        if (cancelled) return
        setInitialLevels(levels)
        replace(levels)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [institution, isOpen, reset, replace, fetchLevels])

  const handleClose = () => {
    reset()
    setInitialLevels(null)
    setEditInstitutionModal({ isOpen: false, institution: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!institution) return
    const dto: UpdateInstitutionDto = {}
    if (values.name !== institution.name) dto.name = values.name
    if (values.type !== institution.type) dto.type = values.type
    if (values.isActive !== institution.isActive) dto.isActive = values.isActive
    if (Object.keys(dto).length > 0) await updateInstitution(institution.id, dto)
    if (initialLevels) {
      const levels = values.levels.map((l) => ({ name: l.name, code: l.code, minPercent: l.minPercent }))
      const sorted = [...levels].sort((a, b) => b.minPercent - a.minPercent)
      if (!sameLevels(sorted, initialLevels)) await saveLevels(institution.id, levels)
    }
    handleClose()
  }

  const levelsError = errors.levels?.root?.message ?? errors.levels?.message

  return (
    <Dialog open={isOpen} onClose={handleClose} fullScreen={isPhone} fullWidth maxWidth="sm">
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>Шкала рівнів</Typography>
          <Typography variant="body2" color="text.secondary">
            Без шкали у звіті буде лише відсоток
          </Typography>
          {fields.map((row, index) => (
            <Box
              key={row.id}
              sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { sm: 'flex-start' } }}
            >
              <Controller
                name={`levels.${index}.name`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField {...field} label="Назва" fullWidth error={!!error} helperText={error?.message} />
                )}
              />
              <Controller
                name={`levels.${index}.code`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Код"
                    error={!!error}
                    helperText={error?.message}
                    sx={{ minWidth: { sm: 90 } }}
                  />
                )}
              />
              <Controller
                name={`levels.${index}.minPercent`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="від, %"
                    error={!!error}
                    helperText={error?.message}
                    sx={{ minWidth: { sm: 110 } }}
                  />
                )}
              />
              <IconButton
                onClick={() => remove(index)}
                aria-label="Видалити рівень"
                sx={{ alignSelf: { xs: 'flex-end', sm: 'flex-start' }, mt: { sm: 0.5 } }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          ))}
          {levelsError && (
            <Typography variant="body2" color="error">
              {levelsError}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Button
              onClick={() => append({ name: '', code: '', minPercent: 0 })}
              disabled={initialLevels === null || fields.length >= 10}
            >
              Додати рівень
            </Button>
            <Button onClick={() => replace(defaultLevels)} disabled={initialLevels === null}>
              Заповнити типовою шкалою
            </Button>
          </Box>
        </Box>

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
