import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useFinanceBalancesStore } from '../model/financeBalancesStore'
import { useGroupsStore } from '../../groups/model/groupsStore'
import {
  financeCategories,
  financeCategoryLabels,
  formatMoney,
  institutionTypeLabels,
  type FinanceCategory,
} from '../../../shared/api'

export const FinanceBalancesPage = () => {
  const balances = useFinanceBalancesStore((s) => s.balances)
  const filters = useFinanceBalancesStore((s) => s.filters)
  const setFilters = useFinanceBalancesStore((s) => s.setFilters)
  const fetchBalances = useFinanceBalancesStore((s) => s.fetchBalances)
  const navigate = useNavigate()
  const groups = useGroupsStore((s) => s.groups)
  const fetchGroups = useGroupsStore((s) => s.fetchGroups)
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, 'uk')),
    [groups],
  )
  const groupId = groups.some((g) => g.id === filters.groupId) ? filters.groupId : undefined
  const [paging, setPaging] = useState({ page: 0, filters })
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const lastPage = Math.max(0, Math.ceil(balances.length / rowsPerPage) - 1)
  const currentPage = Math.min(paging.filters === filters ? paging.page : 0, lastPage)
  const pagedBalances = balances.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage)

  useEffect(() => {
    if (useFinanceBalancesStore.getState().filters.groupId) setFilters({ groupId: undefined })
    fetchGroups().catch(() => undefined)
  }, [fetchGroups, setFilters])

  useEffect(() => {
    fetchBalances()
  }, [filters, fetchBalances])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
          Всього учнів: {balances.length}
        </Typography>
        <TextField
          select
          size="small"
          label="Група"
          value={groupId ?? ''}
          onChange={(e) => setFilters({ groupId: e.target.value || undefined })}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Усі групи</MenuItem>
          {sortedGroups.map((g) => (
            <MenuItem key={g.id} value={g.id}>
              {g.institution ? `${g.name} · ${g.institution.name}` : g.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Категорія"
          value={filters.category ?? ''}
          onChange={(e) =>
            setFilters({ category: (e.target.value || undefined) as FinanceCategory | undefined })
          }
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Усі категорії</MenuItem>
          {financeCategories.map((key) => (
            <MenuItem key={key} value={key}>{financeCategoryLabels[key]}</MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasDebt === 'true'}
              onChange={(e) => setFilters({ hasDebt: e.target.checked ? 'true' : undefined })}
            />
          }
          label="Лише з боргом"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasUnallocated === 'true'}
              onChange={(e) => setFilters({ hasUnallocated: e.target.checked ? 'true' : undefined })}
            />
          }
          label="Є нерозподілені оплати"
        />
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
              <TableCell>#</TableCell>
              <TableCell>Учень</TableCell>
              <TableCell>Заклад</TableCell>
              <TableCell>Група</TableCell>
              <TableCell align="right">Разом до сплати</TableCell>
              <TableCell align="right">Борг</TableCell>
              <TableCell align="right">Передоплата</TableCell>
              <TableCell align="right">Нерозподілено</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Немає учнів за цими фільтрами.
                </TableCell>
              </TableRow>
            ) : (
              pagedBalances.map((row, index) => (
                <TableRow
                  key={row.childId}
                  hover
                  onClick={() => navigate(`/finance/${row.childId}`)}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell sx={{ color: 'text.secondary', width: 40 }}>{currentPage * rowsPerPage + index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {row.lastName} {row.firstName}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {row.group
                      ? `${institutionTypeLabels[row.group.institution.type]} · ${row.group.institution.name}`
                      : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{row.group?.name ?? '—'}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: Number(row.totalDue) > 0 ? 'error.main' : 'text.primary' }}
                  >
                    {formatMoney(row.totalDue)}
                  </TableCell>
                  <TableCell align="right">{formatMoney(row.debt)}</TableCell>
                  <TableCell align="right">{formatMoney(row.prepayment)}</TableCell>
                  <TableCell align="right">{formatMoney(row.unallocated)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {balances.length > 0 && (
          <TablePagination
            component="div"
            count={balances.length}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, next) => setPaging({ page: next, filters })}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value))
              setPaging({ page: 0, filters })
            }}
            labelRowsPerPage="Рядків на сторінці:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} з ${count}`}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </TableContainer>
    </Box>
  )
}
