import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Autocomplete, Box, Button, Dialog, DialogTitle, TextField } from '@mui/material'
import { useClassGroupStore } from '../model/classGroupStore'
import { localToday } from '../../../shared/api'

const schema = yup.object({
  childId: yup.string().required("Обов'язкове поле"),
  startDate: yup.string().required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

export const AddMemberModal = () => {
  const open = useClassGroupStore((s) => s.addMemberOpen)
  const setOpen = useClassGroupStore((s) => s.setAddMemberOpen)
  const children = useClassGroupStore((s) => s.children)
  const addMember = useClassGroupStore((s) => s.addMember)
  const isSaving = useClassGroupStore((s) => s.isSaving)

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { childId: '', startDate: localToday() },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset({ childId: '', startDate: localToday() })
    setOpen(false)
  }

  const onSubmit = async (values: FormValues) => {
    await addMember(values.childId, values.startDate)
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Додати дитину</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="childId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              options={children}
              getOptionLabel={(c) => `${c.lastName} ${c.firstName}`}
              value={children.find((c) => c.id === field.value) ?? null}
              onChange={(_, selected) => field.onChange(selected?.id ?? '')}
              renderInput={(params) => (
                <TextField {...params} label="Дитина" error={!!error} helperText={error?.message} />
              )}
            />
          )}
        />
        <Controller
          name="startDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Дата входу"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Додати
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
