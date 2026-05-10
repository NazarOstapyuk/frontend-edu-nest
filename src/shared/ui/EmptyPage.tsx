import { Box, Typography } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'

interface EmptyPageProps {
  title: string
}

export const EmptyPage = ({ title }: EmptyPageProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      gap: 1.5,
      color: 'text.secondary',
    }}
  >
    <ConstructionIcon sx={{ fontSize: 48, opacity: 0.4 }} />
    <Typography variant="h6" fontWeight={600}>
      {title}
    </Typography>
    <Typography variant="body2">Сторінка в розробці</Typography>
  </Box>
)
