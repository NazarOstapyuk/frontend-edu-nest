import { Box, Paper, Typography } from '@mui/material'
import { financeCategoryLabels, formatMoney, type CategorySummary } from '../../../shared/api'
import { brandColors } from '../../../shared/assets/brand'

interface CategoryTilesProps {
  categories: CategorySummary[]
  totalDue: string
  unallocated: string
}

export const CategoryTiles = ({ categories, totalDue, unallocated }: CategoryTilesProps) => {
  const total = Number(totalDue)
  return (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 2,
      mb: 3,
    }}
  >
    <Paper
      elevation={0}
      sx={{ p: 2.5, borderRadius: '20px', bgcolor: brandColors.ink, color: '#fff' }}
    >
      <Typography sx={{ fontWeight: 700, mb: 1, color: 'rgba(255,255,255,0.8)' }}>
        {total >= 0 ? 'Разом до сплати' : 'Передоплата'}
      </Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2 }}>
        {formatMoney(total >= 0 ? total : -total)}
      </Typography>
      {Number(unallocated) > 0 && (
        <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.8)' }}>
          Нерозподілено: {formatMoney(unallocated)}
        </Typography>
      )}
    </Paper>
    {categories.map((c) => {
      const debt = Number(c.debt)
      const prepayment = Number(c.prepayment)
      return (
        <Paper
          key={c.category}
          elevation={0}
          sx={{ p: 2.5, borderRadius: '20px', boxShadow: brandColors.outline }}
        >
          <Typography sx={{ fontWeight: 800, mb: 1 }}>{financeCategoryLabels[c.category]}</Typography>
          <Typography variant="body2" color="text.secondary">
            Нараховано: {formatMoney(c.charged)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Сплачено: {formatMoney(c.paid)}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: debt > 0 ? brandColors.debt : 'text.secondary', fontWeight: debt > 0 ? 800 : 400 }}
          >
            Борг: {formatMoney(c.debt)}
          </Typography>
          {prepayment > 0 && (
            <Typography variant="body2" color="success.main">
              Передоплата: {formatMoney(c.prepayment)}
            </Typography>
          )}
        </Paper>
      )
    })}
  </Box>
  )
}
