import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useTariffsStore } from '../model/tariffsStore'
import {
  billingModeLabels,
  financeCategoryLabels,
  formatMoney,
  tariffUnitLabels,
} from '../../../shared/api'
import { CreateTariffModal } from './CreateTariffModal'
import { TariffModal } from './TariffModal'

export const TariffsPage = () => {
  const tariffs = useTariffsStore((s) => s.tariffs)
  const problems = useTariffsStore((s) => s.problems)
  const leadDays = useTariffsStore((s) => s.leadDays)
  const lastRun = useTariffsStore((s) => s.lastRun)
  const isSaving = useTariffsStore((s) => s.isSaving)
  const fetchAll = useTariffsStore((s) => s.fetchAll)
  const setLeadDays = useTariffsStore((s) => s.setLeadDays)
  const runBilling = useTariffsStore((s) => s.runBilling)
  const setCreateTariffModal = useTariffsStore((s) => s.setCreateTariffModal)
  const setTariffModal = useTariffsStore((s) => s.setTariffModal)
  const [leadInput, setLeadInput] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const leadValue = leadInput ?? (leadDays === null ? '' : String(leadDays))
  const parsedLead = Number(leadValue)
  const leadValid = /^\d{1,2}$/.test(leadValue.trim()) && parsedLead <= 60

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
          Всього тарифів: {tariffs.length}
        </Typography>
        <TextField
          size="small"
          label="Нараховувати за N днів"
          value={leadValue}
          onChange={(e) => setLeadInput(e.target.value)}
          error={leadInput !== null && !leadValid}
          sx={{ width: 200 }}
        />
        <Button
          variant="outlined"
          disabled={isSaving || leadDays === null || leadInput === null || !leadValid || parsedLead === leadDays}
          onClick={async () => {
            await setLeadDays(parsedLead)
            setLeadInput(null)
          }}
        >
          Зберегти
        </Button>
        <Button variant="outlined" startIcon={<PlayArrowIcon />} disabled={isSaving} onClick={() => runBilling()}>
          Нарахувати зараз
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateTariffModal({ isOpen: true })}>
          Створити тариф
        </Button>
      </Box>

      {lastRun && (
        <Alert severity={lastRun.failed.length ? 'warning' : 'success'} sx={{ mb: 2 }}>
          Створено нарахувань: {lastRun.created}, нульових періодів: {lastRun.skippedZero}, помилок:{' '}
          {lastRun.failed.length}
        </Alert>
      )}

      {problems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Проблеми нарахування</Typography>
          {problems.map((p) => (
            <Typography key={`${p.enrollmentId}-${p.periodStart}`} variant="body2">
              {p.childName} — {p.tariffName}: немає ціни на {new Date(p.periodStart).toLocaleDateString('uk-UA')}
            </Typography>
          ))}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Назва</TableCell>
              <TableCell>Категорія</TableCell>
              <TableCell>Одиниця</TableCell>
              <TableCell>Режим</TableCell>
              <TableCell align="right">Поточна ціна</TableCell>
              <TableCell>Стан</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tariffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Тарифів ще немає. Натисніть «Створити тариф».
                </TableCell>
              </TableRow>
            ) : (
              tariffs.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => setTariffModal({ isOpen: true, tariffId: t.id })}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                  <TableCell>{financeCategoryLabels[t.category]}</TableCell>
                  <TableCell>
                    {tariffUnitLabels[t.unit]}
                    {t.packageSize ? ` (${t.packageSize})` : ''}
                  </TableCell>
                  <TableCell>{billingModeLabels[t.billingMode]}</TableCell>
                  <TableCell align="right">{t.currentPrice ? formatMoney(t.currentPrice) : '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={t.isActive ? 'Активний' : 'Неактивний'}
                      color={t.isActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateTariffModal />
      <TariffModal />
    </Box>
  )
}
