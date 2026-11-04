import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useClassesStore } from '../model/classesStore'
import {
  classFormats,
  missedRuleLabels,
  missedRules,
  type ClassFormat,
  type DirectionGroupDto,
  type MissedLessonRule,
} from '../../../shared/api'
import { GroupFields } from './GroupFields'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").min(2, 'Мінімум 2 символи').max(100, 'Максимум 100 символів'),
  missedRule: yup.mixed<MissedLessonRule>().oneOf(missedRules).required("Обов'язкове поле"),
  format: yup.mixed<ClassFormat>().oneOf(classFormats).required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
  singleTariffId: yup.string().default(''),
  packageTariffId: yup.string().default(''),
})

type FormValues = yup.InferType<typeof schema>

const defaults: FormValues = {
  name: '',
  missedRule: 'no_charge',
  format: 'group',
  teacherIds: [],
  singleTariffId: '',
  packageTariffId: '',
}

export const DirectionModal = () => {
  const { isOpen, direction } = useClassesStore((s) => s.directionModal)
  const setDirectionModal = useClassesStore((s) => s.setDirectionModal)
  const saveDirection = useClassesStore((s) => s.saveDirection)
  const saveCircle = useClassesStore((s) => s.saveCircle)
  const isSaving = useClassesStore((s) => s.isSaving)
  const isPhone = useIsPhone()
  const group = direction?.groups.length === 1 ? direction.groups[0] : null
  const withGroup = !direction || !!group

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: defaults,
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (!isOpen) return
    reset(
      direction
        ? {
            name: direction.name,
            missedRule: direction.missedRule,
            format: group?.format ?? 'group',
            teacherIds: group?.teachers.map((t) => t.id) ?? [],
            singleTariffId: group?.singleTariff?.id ?? '',
            packageTariffId: group?.packageTariff?.id ?? '',
          }
        : defaults,
    )
  }, [isOpen, direction, group, reset])

  const handleClose = () => {
    reset(defaults)
    setDirectionModal({ isOpen: false, direction: null })
  }

  const onSubmit = async (values: FormValues) => {
    const name = values.name.trim()
    const groupDto: DirectionGroupDto = {
      format: values.format,
      teacherIds: values.teacherIds,
      singleTariffId: values.singleTariffId || null,
      packageTariffId: values.packageTariffId || null,
    }
    if (!direction) {
      await saveDirection({ name, missedRule: values.missedRule, group: groupDto })
    } else {
      const renameGroup = !!group && group.name === direction.name && name !== direction.name
      await saveCircle(
        direction,
        { name, missedRule: values.missedRule },
        group ? { ...groupDto, ...(renameGroup ? { name } : {}) } : undefined,
      )
    }
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 700 }}>{direction ? 'Редагувати гурток' : 'Новий гурток'}</DialogTitle>
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
        {withGroup && <GroupFields control={control} group={group} />}
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
