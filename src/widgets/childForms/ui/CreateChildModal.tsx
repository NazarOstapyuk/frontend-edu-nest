import { useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material'
import { genderLabels, type CreateChildDto, type Gender, type Group, type UserLookup } from '../../../shared/api'
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  firstName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  lastName: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  middleName: yup.string().default('').max(100, 'Максимум 100 символів'),
  birthDate: yup.string().required("Обов'язкове поле"),
  gender: yup.mixed<Gender>().oneOf(['male', 'female']).required("Обов'язкове поле"),
  groupId: yup.string().required("Обов'язкове поле"),
  parentIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

interface CreateChildModalProps {
  isOpen: boolean
  isSubmitting: boolean
  parents: UserLookup[]
  onCreateParent?: () => void
  groups: Group[]
  presetGroupId?: string | null
  onSubmit: (dto: CreateChildDto) => Promise<unknown>
  onClose: () => void
}

export const CreateChildModal = ({
  isOpen,
  isSubmitting,
  parents: parentLookup,
  onCreateParent,
  groups,
  presetGroupId,
  onSubmit: submit,
  onClose,
}: CreateChildModalProps) => {
  const isPhone = useIsPhone()
  const institutions = useInstitutionStore((s) => s.institutions)
  const groupLabel = (g: Group) => `${g.name} · ${g.institution.name}`
  const parentLabel = (p: UserLookup) =>
    `${[p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ')}${p.phone ? ` · ${p.phone}` : ''}`
  const parentOptions = (selected: string[]) => parentLookup.filter((p) => p.isActive || selected.includes(p.id))

  const groupOptions = (current: string) =>
    groups.filter(
      (g) => g.id === current || institutions.find((i) => i.id === g.institution.id)?.isActive !== false,
    )

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { firstName: '', lastName: '', middleName: '', birthDate: '', gender: 'male', groupId: '', parentIds: [] },
    resolver: yupResolver(schema),
  })

  const groupId = useWatch({ control, name: 'groupId' })
  const onlyGroupId = groupOptions('').length === 1 ? groupOptions('')[0].id : ''

  useEffect(() => {
    if (!isOpen) return
    if (presetGroupId) setValue('groupId', presetGroupId)
    else if (onlyGroupId && !groupId) setValue('groupId', onlyGroupId)
  }, [isOpen, presetGroupId, onlyGroupId, groupId, setValue])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    await submit({
      firstName: values.firstName,
      lastName: values.lastName,
      middleName: values.middleName.trim() || undefined,
      birthDate: values.birthDate,
      gender: values.gender as Gender,
      groupId: values.groupId,
      parentIds: values.parentIds ?? [],
    })
    handleClose()
  }

  return (
    <Dialog fullScreen={isPhone} open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Новий учень</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Прізвище"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Ім'я"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="middleName"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="По батькові"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Дата народження"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="gender"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              select
              label="Стать"
              fullWidth
              error={!!error}
              helperText={error?.message}
            >
              {(Object.keys(genderLabels) as Gender[]).map((key) => (
                <MenuItem key={key} value={key}>{genderLabels[key]}</MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="groupId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              options={groupOptions(field.value)}
              getOptionLabel={groupLabel}
              value={groups.find((g) => g.id === field.value) ?? null}
              onChange={(_, selected) => field.onChange(selected?.id ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Група"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}
        />

        <Controller
          name="parentIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={parentOptions(field.value ?? [])}
              getOptionLabel={parentLabel}
              value={parentLookup.filter((p) => field.value?.includes(p.id))}
              onChange={(_, selected) => field.onChange(selected.map((p) => p.id))}
              renderInput={(params) => <TextField {...params} label="Батьки" />}
            />
          )}
        />

        {onCreateParent && (
          <Button size="small" onClick={onCreateParent} sx={{ alignSelf: 'flex-start', mt: '-12px' }}>
            Новий батько
          </Button>
        )}

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
