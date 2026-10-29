import type { ReactNode } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'

interface CardListProps<T> {
  items: T[]
  getKey: (item: T) => string
  renderCard: (item: T) => ReactNode
  empty?: ReactNode
}

export const CardList = <T,>({ items, getKey, renderCard, empty }: CardListProps<T>) => {
  if (items.length === 0) return <>{empty ?? null}</>
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {items.map((item) => (
        <Card key={getKey(item)} variant="outlined">
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>{renderCard(item)}</CardContent>
        </Card>
      ))}
    </Box>
  )
}

interface CardFieldProps {
  label: string
  children: ReactNode
}

export const CardField = ({ label, children }: CardFieldProps) => (
  <Box sx={{ display: 'flex', gap: 1, py: 0.25, alignItems: 'baseline' }}>
    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}:
    </Typography>
    <Typography component="div" variant="body2" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
      {children}
    </Typography>
  </Box>
)
