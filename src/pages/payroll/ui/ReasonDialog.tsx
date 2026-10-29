import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { usePayrollStore } from '../model/payrollStore'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const schema = yup.object({
  reason: yup.string().trim().required('Вкажіть причину').max(500, 'Не більше 500 символів'),
})

type FormValues = yup.InferType<typeof schema>

interface Props {
  title: string
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}

export const ReasonDialog = ({ title, onClose, onSubmit }: Props) => {
  const isPhone = useIsPhone()
  const isSaving = usePayrollStore((s) => s.isSaving)
  const { control, handleSubmit } = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: { reason: '' },
  })

  const submit = (values: FormValues) => {
    onSubmit(values.reason).then(onClose).catch(() => undefined)
  }

  return (
    <Dialog fullScreen={isPhone} open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Controller
          name="reason"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Причина"
              error={!!error}
              helperText={error?.message}
              fullWidth
              multiline
              sx={{ mt: 1 }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving} onClick={handleSubmit(submit)}>
          Підтвердити
        </Button>
      </DialogActions>
    </Dialog>
  )
}
