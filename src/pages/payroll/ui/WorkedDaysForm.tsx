import { useState } from 'react'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { payrollApi, type PayrollDetail } from '../../../shared/api'
import { usePayrollStore } from '../model/payrollStore'

export const WorkedDaysForm = ({ detail }: { detail: PayrollDetail }) => {
  const runDetail = usePayrollStore((s) => s.runDetail)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const [value, setValue] = useState(String(detail.days.workedDays))
  const parsed = Number(value)
  const valid = /^\d{1,2}$/.test(value) && parsed <= 31

  const save = (workedDays: number | null) => {
    runDetail((teacherId, month) => payrollApi.setWorkedDays(teacherId, month, workedDays)).catch(() => undefined)
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
      <Typography variant="body2" sx={{ flex: 1 }}>
        Робочих днів у місяці: {detail.days.normDays}, за умовами: {detail.days.defaultDays}
      </Typography>
      <TextField
        size="small"
        label="Відпрацьовано днів"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={!valid}
        sx={{ width: 170 }}
      />
      <Button size="small" disabled={!valid || isSaving || parsed === detail.days.workedDays} onClick={() => save(parsed)}>
        Зберегти
      </Button>
      {detail.days.override && (
        <Button size="small" disabled={isSaving} onClick={() => save(null)}>
          Як за умовами
        </Button>
      )}
    </Stack>
  )
}
