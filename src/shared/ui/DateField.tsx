import { useState, type Ref } from 'react'
import type { SxProps, Theme } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'

const FORMAT = 'YYYY-MM-DD'

const toDay = (value: string | null | undefined): Dayjs | null => (value ? dayjs(value.slice(0, 10)) : null)

type DateFieldProps = {
  value: string | null | undefined
  onChange: (value: string) => void
  label?: string
  name?: string
  onBlur?: () => void
  ref?: Ref<HTMLInputElement>
  min?: string
  max?: string
  error?: boolean
  helperText?: string | null
  fullWidth?: boolean
  size?: 'small' | 'medium'
  disabled?: boolean
  required?: boolean
  sx?: SxProps<Theme>
}

export const DateField = ({
  value,
  onChange,
  label,
  name,
  onBlur,
  ref,
  min,
  max,
  error,
  helperText,
  fullWidth,
  size,
  disabled,
  required,
  sx,
}: DateFieldProps) => {
  const current = value ?? ''
  const [state, setState] = useState({ value: current, day: toDay(current) })
  if (state.value !== current) setState({ value: current, day: toDay(current) })

  const change = (day: Dayjs | null) => {
    const next = day && day.isValid() ? day.format(FORMAT) : ''
    setState({ value: next, day })
    if (next !== current) onChange(next)
  }

  return (
    <DatePicker
      label={label}
      value={state.day}
      onChange={change}
      format="DD.MM.YYYY"
      minDate={min ? dayjs(min) : undefined}
      maxDate={max ? dayjs(max) : undefined}
      disabled={disabled}
      sx={sx}
      slotProps={{
        textField: { name, onBlur, inputRef: ref, error, helperText: helperText ?? undefined, fullWidth, size, required },
      }}
    />
  )
}
