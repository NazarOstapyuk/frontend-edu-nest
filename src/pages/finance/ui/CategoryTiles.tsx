import { Box, Paper, Typography } from '@mui/material'
import { financeCategoryLabels, formatMoney, type CategorySummary } from '../../../shared/api'

interface CategoryTilesProps {
  categories: CategorySummary[]
}

export const CategoryTiles = ({ categories }: CategoryTilesProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 2,
      mb: 3,
    }}
  >
    {categories.map((c) => {
      const debt = Number(c.debt)
      const prepayment = Number(c.prepayment)
      return (
        <Paper
          key={c.category}
          elevation={0}
          sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Typography sx={{ fontWeight: 700, mb: 1 }}>{financeCategoryLabels[c.category]}</Typography>
          <Typography variant="body2" color="text.secondary">
            Нараховано: {formatMoney(c.charged)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Сплачено: {formatMoney(c.paid)}
          </Typography>
          <Typography variant="body2" sx={{ color: debt > 0 ? 'error.main' : 'text.secondary' }}>
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
