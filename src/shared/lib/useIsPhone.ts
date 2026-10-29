import { useMediaQuery, useTheme } from '@mui/material'

export const useIsPhone = (): boolean => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.down('sm'))
}
