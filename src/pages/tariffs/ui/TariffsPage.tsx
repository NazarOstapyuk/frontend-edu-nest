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
import { useInstitutionStore } from '../../../shared/model/institutionStore'
import { useCan } from '../../../entities/user'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { CardList, CardField } from '../../../shared/ui/CardList'
import {
  billingModeLabels,
  financeCategoryLabels,
  formatMoney,
  tariffUnitLabels,
} from '../../../shared/api'
import { CreateTariffModal } from './CreateTariffModal'
import { TariffModal } from './TariffModal'
import { HistoryButton } from '../../../widgets/auditHistory'

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
  const canEdit = useCan('tariffs', 'edit')
  const canEditSettings = useCan('settings', 'edit')
  const institutions = useInstitutionStore((s) => s.institutions)
  const [leadInput, setLeadInput] = useState<string | null>(null)
  const isPhone = useIsPhone()

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
        {canEditSettings && (
          <TextField
            size="small"
            label="Нараховувати за N днів"
            value={leadValue}
            onChange={(e) => setLeadInput(e.target.value)}
            error={leadInput !== null && !leadValid}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
        )}
        {canEditSettings && (
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
        )}
        {canEdit && (
          <Button variant="outlined" startIcon={<PlayArrowIcon />} disabled={isSaving} onClick={() => runBilling()}>
            Нарахувати зараз
          </Button>
        )}
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateTariffModal({ isOpen: true })}>
            Створити тариф
          </Button>
        )}
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
              {p.childName} — {p.tariffName}: немає ціни на {new Date(p.periodStart).toLocaleDateString('uk-UA', { timeZone: 'UTC' })}
            </Typography>
          ))}
        </Alert>
      )}

      {isPhone ? (
        <CardList
          items={tariffs}
          getKey={(t) => t.id}
          empty={
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              Тарифів ще немає. Натисніть «Створити тариф».
            </Typography>
          }
          renderCard={(t) => (
            <Box onClick={() => setTariffModal({ isOpen: true, tariffId: t.id })} sx={{ cursor: 'pointer' }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t.name}</Typography>
              <Box sx={{ mb: 0.5 }}>
                <Chip
                  size="small"
                  label={t.isActive ? 'Активний' : 'Неактивний'}
                  color={t.isActive ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
              <CardField label="Заклад">
                {t.institutionId ? (institutions.find((i) => i.id === t.institutionId)?.name ?? '—') : 'Спільний'}
              </CardField>
              <CardField label="Категорія">{financeCategoryLabels[t.category]}</CardField>
              <CardField label="Одиниця">
                {tariffUnitLabels[t.unit]}
                {t.packageSize ? ` (${t.packageSize})` : ''}
              </CardField>
              <CardField label="Режим">{billingModeLabels[t.billingMode]}</CardField>
              <CardField label="Поточна ціна">{t.currentPrice ? formatMoney(t.currentPrice) : '—'}</CardField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
                <HistoryButton entityType="tariffs" entityId={t.id} title={t.name} />
              </Box>
            </Box>
          )}
        />
      ) : (
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>Назва</TableCell>
              <TableCell>Заклад</TableCell>
              <TableCell>Категорія</TableCell>
              <TableCell>Одиниця</TableCell>
              <TableCell>Режим</TableCell>
              <TableCell align="right">Поточна ціна</TableCell>
              <TableCell>Стан</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {tariffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
                  <TableCell>
                    {t.institutionId ? (institutions.find((i) => i.id === t.institutionId)?.name ?? '—') : 'Спільний'}
                  </TableCell>
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
                  <TableCell align="right">
                    <HistoryButton entityType="tariffs" entityId={t.id} title={t.name} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <CreateTariffModal />
      <TariffModal />
    </Box>
  )
}
