import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import {
  ALL_AREAS,
  areaLabels,
  levelLabels,
  levelSatisfies,
  type PermissionArea,
  type PermissionItem,
  type PermissionLevel,
} from '../../../shared/api'
import { useAuthStore } from '../../../entities/user'
import { usePositionsPageStore } from '../model/positionsPageStore'

type Level = PermissionLevel | 'none'

const schema = yup.object({
  name: yup.string().trim().min(2, 'Мінімум 2 символи').max(100, 'Максимум 100 символів').required("Обов'язкове поле"),
  teaching: yup.boolean().required(),
  levels: yup
    .mixed<Record<PermissionArea, Level>>()
    .required(),
})

type FormValues = yup.InferType<typeof schema>

const emptyLevels = Object.fromEntries(ALL_AREAS.map((area) => [area, 'none'])) as Record<PermissionArea, Level>

const toLevels = (permissions: PermissionItem[]) => {
  const levels = { ...emptyLevels }
  permissions.forEach((p) => {
    levels[p.area] = p.level
  })
  return levels
}

const toPermissions = (levels: Record<PermissionArea, Level>): PermissionItem[] =>
  ALL_AREAS.flatMap((area) => {
    const level = levels[area]
    return level && level !== 'none' ? [{ area, level }] : []
  })

export const PositionDialog = () => {
  const profile = useAuthStore((s) => s.profile)
  const createModal = usePositionsPageStore((s) => s.createModal)
  const editModal = usePositionsPageStore((s) => s.editModal)
  const setCreateModal = usePositionsPageStore((s) => s.setCreateModal)
  const setEditModal = usePositionsPageStore((s) => s.setEditModal)
  const createPosition = usePositionsPageStore((s) => s.createPosition)
  const updatePosition = usePositionsPageStore((s) => s.updatePosition)
  const isCreating = usePositionsPageStore((s) => s.isCreating)
  const isUpdating = usePositionsPageStore((s) => s.isUpdating)

  const position = editModal.position
  const isOpen = createModal.isOpen || editModal.isOpen
  const isEdit = editModal.isOpen
  const typeLocked = isEdit && (position?.userCount ?? 0) > 0
  const isRoot = profile?.role === 'root'

  const { control, reset, handleSubmit } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', teaching: false, levels: emptyLevels },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (editModal.isOpen && editModal.position) {
      reset({
        name: editModal.position.name,
        teaching: editModal.position.teaching,
        levels: toLevels(editModal.position.permissions),
      })
    } else if (createModal.isOpen) {
      reset({ name: '', teaching: false, levels: emptyLevels })
    }
  }, [editModal.isOpen, editModal.position, createModal.isOpen, reset])

  const handleClose = () => {
    setCreateModal({ isOpen: false })
    setEditModal({ isOpen: false, position: null })
  }

  const allowed = (level: PermissionLevel, area: PermissionArea) =>
    isRoot || levelSatisfies(profile?.permissions?.[area], level)

  const onSubmit = async (values: FormValues) => {
    const permissions = toPermissions(values.levels)
    if (isEdit && position) {
      await updatePosition(position.id, {
        name: values.name.trim(),
        permissions,
        ...(typeLocked ? {} : { teaching: values.teaching }),
      })
    } else {
      await createPosition({ name: values.name.trim(), teaching: values.teaching, permissions })
    }
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Редагувати посаду' : 'Нова посада'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Box>
          <Controller
            name="teaching"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    disabled={typeLocked}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
                label="Педагогічна посада"
              />
            )}
          />
          {typeLocked && <FormHelperText>Не можна змінити, поки на посаді є працівники</FormHelperText>}
        </Box>
        <Typography variant="subtitle2">Доступ</Typography>
        <Controller
          name="levels"
          control={control}
          render={({ field }) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ALL_AREAS.map((area) => (
                <TextField
                  key={area}
                  select
                  size="small"
                  label={areaLabels[area]}
                  fullWidth
                  value={field.value[area] ?? 'none'}
                  onChange={(event) => field.onChange({ ...field.value, [area]: event.target.value as Level })}
                >
                  <MenuItem value="none">Немає</MenuItem>
                  <MenuItem value="view" disabled={!allowed('view', area)}>
                    {levelLabels.view}
                  </MenuItem>
                  <MenuItem value="edit" disabled={!allowed('edit', area)}>
                    {levelLabels.edit}
                  </MenuItem>
                </TextField>
              ))}
            </Box>
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isCreating || isUpdating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
