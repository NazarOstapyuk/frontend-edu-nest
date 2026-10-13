import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { localToday, payrollApi, type SalaryTerms } from '../../../shared/api'
import { usePayrollStore } from '../model/payrollStore'

const schema = yup.object({ validTo: yup.string().required('Вкажіть дату') })

type FormValues = yup.InferType<typeof schema>

interface Props {
  terms: SalaryTerms
  onClose: () => void
}

export const CloseTermsDialog = ({ terms, onClose }: Props) => {
  const runTerms = usePayrollStore((s) => s.runTerms)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const { control, handleSubmit } = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: { validTo: localToday() },
  })

  const onSubmit = (values: FormValues) => {
    runTerms(() => payrollApi.closeTerms(terms.id, values.validTo)).then(onClose).catch(() => undefined)
  }

  return (
    <Dialog open fullWidth maxWidth="xs" onClose={onClose}>
      <DialogTitle>Закрити умови</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Останній день дії умов, наприклад день звільнення.
        </Typography>
        <Controller
          name="validTo"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              type="date"
              label="Діють до"
              error={!!error}
              helperText={error?.message}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving} onClick={handleSubmit(onSubmit)}>
          Закрити умови
        </Button>
      </DialogActions>
    </Dialog>
  )
}
