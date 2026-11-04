import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, FormControlLabel, Switch, TextField } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useClassesStore } from '../model/classesStore'
import { classFormats, type ClassFormat } from '../../../shared/api'
import { GroupFields } from './GroupFields'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").min(2, 'Мінімум 2 символи').max(100, 'Максимум 100 символів'),
  format: yup.mixed<ClassFormat>().oneOf(classFormats).required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
  singleTariffId: yup.string().default(''),
  packageTariffId: yup.string().default(''),
  isActive: yup.boolean().default(true),
})

type FormValues = yup.InferType<typeof schema>

const defaults: FormValues = { name: '', format: 'group', teacherIds: [], singleTariffId: '', packageTariffId: '', isActive: true }

export const GroupModal = () => {
  const { isOpen, directionId, group, defaultName } = useClassesStore((s) => s.groupModal)
  const setGroupModal = useClassesStore((s) => s.setGroupModal)
  const saveGroup = useClassesStore((s) => s.saveGroup)
  const isSaving = useClassesStore((s) => s.isSaving)
  const isPhone = useIsPhone()

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: defaults,
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (!isOpen) return
    reset(
      group
        ? {
            name: group.name,
            format: group.format,
            teacherIds: group.teachers.map((t) => t.id),
            singleTariffId: group.singleTariff?.id ?? '',
            packageTariffId: group.packageTariff?.id ?? '',
            isActive: group.isActive,
          }
        : { ...defaults, name: defaultName },
    )
  }, [isOpen, group, defaultName, reset])

  const handleClose = () => {
    reset(defaults)
    setGroupModal({ isOpen: false, directionId: null, group: null, defaultName: '' })
  }

  const onSubmit = async (values: FormValues) => {
    if (!directionId) return
    await saveGroup(
      {
        name: values.name.trim(),
        directionId,
        format: values.format,
        teacherIds: values.teacherIds,
        singleTariffId: values.singleTariffId || null,
        packageTariffId: values.packageTariffId || null,
        isActive: values.isActive,
      },
      group?.id,
    )
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{group ? 'Редагувати групу гуртка' : 'Нова група гуртка'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <GroupFields control={control} group={group} />
        {group && (
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="Активна"
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
