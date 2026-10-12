import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Checkbox, Dialog, DialogTitle, FormControlLabel, TextField } from '@mui/material'
import { useAbsenceReasonsStore } from '../model/absenceReasonsStore'

const schema = yup.object({
  name: yup.string().trim().required("Обов'язкове поле").max(100, 'Максимум 100 символів'),
  excused: yup.boolean().required(),
  requiresDocument: yup.boolean().required(),
  sortOrder: yup.number().typeError('Вкажіть число').integer('Ціле число').min(0, 'Не менше 0').required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

const empty: FormValues = { name: '', excused: true, requiresDocument: false, sortOrder: 0 }

export const AbsenceReasonModal = () => {
  const modal = useAbsenceReasonsStore((s) => s.modal)
  const setModal = useAbsenceReasonsStore((s) => s.setModal)
  const createReason = useAbsenceReasonsStore((s) => s.createReason)
  const updateReason = useAbsenceReasonsStore((s) => s.updateReason)
  const isSaving = useAbsenceReasonsStore((s) => s.isSaving)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: empty,
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (!modal.isOpen) return
    reset(
      modal.reason
        ? {
            name: modal.reason.name,
            excused: modal.reason.excused,
            requiresDocument: modal.reason.requiresDocument,
            sortOrder: modal.reason.sortOrder,
          }
        : empty,
    )
  }, [modal.isOpen, modal.reason, reset])

  const handleClose = () => {
    reset(empty)
    setModal({ isOpen: false, reason: null })
  }

  const onSubmit = async (values: FormValues) => {
    const dto = { ...values, name: values.name.trim() }
    if (modal.reason) await updateReason(modal.reason.id, dto)
    else await createReason(dto)
    handleClose()
  }

  return (
    <Dialog open={modal.isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{modal.reason ? 'Редагувати причину' : 'Нова причина'}</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Назва" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="excused"
          control={control}
          render={({ field }) => (
            <FormControlLabel control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Поважна причина" />
          )}
        />
        <Controller
          name="requiresDocument"
          control={control}
          render={({ field }) => (
            <FormControlLabel control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Потрібна довідка" />
          )}
        />
        <Controller
          name="sortOrder"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} type="number" label="Порядок" fullWidth error={!!error} helperText={error?.message} />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>Зберегти</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
