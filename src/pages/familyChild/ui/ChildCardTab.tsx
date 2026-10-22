import { Box, Chip, Link, Paper, Typography } from '@mui/material'
import { formatDay, packageStateLabels, type ChildCard } from '../../../shared/api'

const section = { border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 } as const

export const ChildCardTab = ({ card }: { card: ChildCard }) => (
  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
    <Paper elevation={0} sx={section}>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Дитина</Typography>
      <Typography>Дата народження: {formatDay(card.birthDate)}</Typography>
      {card.institution && <Typography>Заклад: {card.institution.name}</Typography>}
      <Typography>Група: {card.group?.name ?? '—'}</Typography>
    </Paper>
    <Paper elevation={0} sx={section}>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Батьки</Typography>
      {card.parents.map((p) => (
        <Box key={p.id} sx={{ mb: 1 }}>
          <Typography>{[p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ')}</Typography>
          {p.phone && <Link href={`tel:${p.phone}`} sx={{ mr: 2 }}>{p.phone}</Link>}
          {p.email && <Link href={`mailto:${p.email}`}>{p.email}</Link>}
        </Box>
      ))}
    </Paper>
    <Paper elevation={0} sx={section}>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Абонементи</Typography>
      {card.enrollments.length === 0 && <Typography color="text.secondary">Немає</Typography>}
      {card.enrollments.map((e) => (
        <Box key={e.id} sx={{ mb: 1 }}>
          <Typography>{e.tariffName}</Typography>
          <Typography variant="body2" color="text.secondary">
            з {formatDay(e.startDate)}{e.endDate ? ` по ${formatDay(e.endDate)}` : ''}
          </Typography>
          {e.pauses.map((p) => (
            <Typography key={p.startDate} variant="body2" color="text.secondary">
              Пауза: {formatDay(p.startDate)}{p.endDate ? ` – ${formatDay(p.endDate)}` : ''}
            </Typography>
          ))}
        </Box>
      ))}
    </Paper>
    <Paper elevation={0} sx={section}>
      <Typography sx={{ fontWeight: 700, mb: 1 }}>Пакети гуртків</Typography>
      {card.packages.length === 0 && <Typography color="text.secondary">Немає</Typography>}
      {card.packages.map((p) => (
        <Box key={p.id} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography>{p.directionName}: залишилось {p.remaining} з {p.sessionsTotal}</Typography>
          {p.expiresAt && <Typography variant="body2" color="text.secondary">до {formatDay(p.expiresAt)}</Typography>}
          <Chip size="small" variant="outlined" label={packageStateLabels[p.state]} />
        </Box>
      ))}
    </Paper>
  </Box>
)
