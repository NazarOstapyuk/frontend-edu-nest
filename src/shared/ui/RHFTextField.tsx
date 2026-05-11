import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { TextField, type TextFieldProps } from '@mui/material'

type RHFTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  name: Path<T>
  control: Control<T>
}

export const RHFTextField = <T extends FieldValues>({ name, control, sx, slotProps, ...props }: RHFTextFieldProps<T>) => {
  const { field, fieldState } = useController({ name, control })

  return (
    <TextField
      {...props}
      {...field}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
      sx={{ position: 'relative', ...sx }}
      slotProps={{
        ...slotProps,
        formHelperText: {
          ...slotProps?.formHelperText,
          sx: { position: 'absolute', bottom: '-20px', mx: 0, ...(slotProps?.formHelperText as { sx?: object })?.sx },
        },
      }}
    />
  )
}
