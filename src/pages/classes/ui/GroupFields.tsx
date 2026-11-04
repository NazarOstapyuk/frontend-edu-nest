import { Controller, useWatch, type Control, type FieldValues } from 'react-hook-form'
import { Alert, Autocomplete, MenuItem, TextField } from '@mui/material'
import { useClassesStore } from '../model/classesStore'
import { classFormatLabels, classFormats, type ClassFormat, type ClassGroupSummary, type Tariff } from '../../../shared/api'

export interface GroupFieldValues {
  format: ClassFormat
  teacherIds: string[]
  singleTariffId: string
  packageTariffId: string
}

interface GroupFieldsProps<T extends FieldValues> {
  control: Control<T>
  group: ClassGroupSummary | null
}

const tariffLabel = (t: Tariff) =>
  [t.name, t.currentPrice ? `${t.currentPrice} грн` : null, t.packageSize ? `${t.packageSize} занять` : null].filter(Boolean).join(' · ')

export const GroupFields = <T extends FieldValues>({ control, group }: GroupFieldsProps<T>) => {
  const fieldsControl = control as unknown as Control<GroupFieldValues>
  const tariffs = useClassesStore((s) => s.tariffs)
  const teachers = useClassesStore((s) => s.teachers)
  const singleTariffId = useWatch({ control: fieldsControl, name: 'singleTariffId' })

  const tariffOptions = (unit: Tariff['unit'], current: { id: string; name: string } | null | undefined) => {
    const options = tariffs
      .filter((t) => t.unit === unit && ((t.institutionId === null && t.isActive) || t.id === current?.id))
      .map((t) => ({ id: t.id, label: tariffLabel(t) }))
    if (current && !options.some((o) => o.id === current.id)) options.push({ id: current.id, label: current.name })
    return options
  }
  const sessionTariffs = tariffOptions('session', group?.singleTariff)
  const packageTariffs = tariffOptions('package', group?.packageTariff)
  const teacherOptions = [
    ...teachers,
    ...(group?.teachers ?? []).filter((gt) => !teachers.some((t) => t.id === gt.id)),
  ]

  return (
    <>
      <Controller
        name="format"
        control={fieldsControl}
        render={({ field, fieldState: { error } }) => (
          <TextField {...field} select label="Формат" fullWidth error={!!error} helperText={error?.message}>
            {classFormats.map((key) => (
              <MenuItem key={key} value={key}>{classFormatLabels[key]}</MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="teacherIds"
        control={fieldsControl}
        render={({ field }) => (
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={teacherOptions}
            getOptionLabel={(t) => `${t.lastName} ${t.firstName}`}
            value={teacherOptions.filter((t) => field.value.includes(t.id))}
            onChange={(_, selected) => field.onChange(selected.map((t) => t.id))}
            renderInput={(params) => <TextField {...params} label="Педагоги" />}
          />
        )}
      />
      <Controller
        name="singleTariffId"
        control={fieldsControl}
        render={({ field }) => (
          <TextField {...field} select label="Тариф разового заняття" fullWidth>
            <MenuItem value="">Немає</MenuItem>
            {sessionTariffs.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
            ))}
          </TextField>
        )}
      />
      {!singleTariffId && (
        <Alert severity="warning">
          Без тарифу разового заняття дітей без пакета не можна буде відмітити на занятті.
        </Alert>
      )}
      <Controller
        name="packageTariffId"
        control={fieldsControl}
        render={({ field }) => (
          <TextField {...field} select label="Тариф пакета" fullWidth>
            <MenuItem value="">Немає</MenuItem>
            {packageTariffs.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
            ))}
          </TextField>
        )}
      />
    </>
  )
}
