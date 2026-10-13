import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Autocomplete, Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { useScheduleSetupStore } from '../model/scheduleSetupStore'
import type { Subgroup } from '../../../shared/api'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
  childIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const SubgroupModal = ({ open, subgroup, onClose }: { open: boolean; subgroup: Subgroup | null; onClose: () => void }) => {
  const children = useScheduleSetupStore((s) => s.children)
  const classId = useScheduleSetupStore((s) => s.classId)
  const saveSubgroup = useScheduleSetupStore((s) => s.saveSubgroup)
  const isSaving = useScheduleSetupStore((s) => s.isSaving)
  const classChildren = useMemo(() => children.filter((c) => c.group?.id === classId), [children, classId])
  const { control, handleSubmit, reset } = useForm<FormValues>({ mode: 'all', defaultValues: { name: '', childIds: [] }, resolver: yupResolver(schema) })

  useEffect(() => {
    if (open) reset(subgroup ? { name: subgroup.name, childIds: subgroup.children.map((c) => c.id) } : { name: '', childIds: [] })
  }, [open, subgroup, reset])

  const submit = async (values: FormValues) => {
    await saveSubgroup(subgroup?.id ?? null, { name: values.name.trim(), childIds: values.childIds ?? [] })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{subgroup ? 'Підгрупа' : 'Нова підгрупа'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => <TextField {...field} label="Назва" placeholder="Англійська 1" error={!!error} helperText={error?.message} />}
        />
        <Controller
          name="childIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={classChildren}
              getOptionLabel={(c) => `${c.lastName} ${c.firstName}`}
              value={classChildren.filter((c) => field.value?.includes(c.id))}
              onChange={(_, selected) => field.onChange(selected.map((c) => c.id))}
              renderInput={(params) => <TextField {...params} label="Діти" />}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit((v) => submit(v).catch(() => undefined))} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
