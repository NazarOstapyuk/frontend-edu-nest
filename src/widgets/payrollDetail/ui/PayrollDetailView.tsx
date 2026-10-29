import { useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  formatDay,
  formatMoney,
  monthLabel,
  payrollAdjustmentKindLabels,
  payrollLessonTypeLabels,
  payrollPaymentMethodLabels,
  toKopecks,
  type PayrollDetail,
  type PayrollLessonType,
  type PayrollLine,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

interface Props {
  detail: PayrollDetail
  onVoidAdjustment?: (id: string) => void
  onVoidPayment?: (id: string) => void
  onVoidExtraHours?: (id: string) => void
  onVoidAbsence?: (id: string) => void
  actions?: { extraHours?: ReactNode; absences?: ReactNode }
  showWarnings?: boolean
}

const lessonTypes: PayrollLessonType[] = ['school_lesson', 'class_group', 'individual']

const sumOf = (lines: PayrollLine[]) => formatMoney(lines.reduce((sum, line) => sum + toKopecks(line.amount), 0) / 100)

const Section = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <Box>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
      <Typography variant="subtitle2">{title}</Typography>
      {action}
    </Stack>
    {children}
  </Box>
)

interface RecordRow {
  key: string
  lead?: ReactNode
  body: ReactNode
  amount?: ReactNode
  action?: ReactNode
  voided?: boolean
}

interface RecordTableProps {
  rows: RecordRow[]
  withAction?: boolean
  footer?: { label: string; amount: ReactNode }
}

const RecordTable = ({ rows, withAction = false, footer }: RecordTableProps) => {
  const isPhone = useIsPhone()
  const hasLead = rows.some((row) => row.lead !== undefined)
  const hasAmount = rows.some((row) => row.amount !== undefined)

  if (isPhone) {
    return (
      <Box>
        {rows.map((row) => (
          <Box key={row.key} sx={{ py: 1, borderBottom: 1, borderColor: 'divider', opacity: row.voided ? 0.6 : 1 }}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>
                {row.lead !== undefined && row.lead !== '' && (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.lead}
                  </Typography>
                )}
                <Typography component="div" variant="body2">
                  {row.body}
                </Typography>
              </Box>
              {row.amount !== undefined && row.amount !== '' && (
                <Typography component="div" variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {row.amount}
                </Typography>
              )}
            </Box>
            {row.action && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>{row.action}</Box>}
          </Box>
        ))}
        {footer && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {footer.label}
            </Typography>
            <Typography component="div" variant="body2" sx={{ fontWeight: 600 }}>
              {footer.amount}
            </Typography>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Table size="small">
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key} sx={row.voided !== undefined ? { opacity: row.voided ? 0.6 : 1 } : undefined}>
            {hasLead && <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.lead}</TableCell>}
            <TableCell>{row.body}</TableCell>
            {hasAmount && (
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {row.amount}
              </TableCell>
            )}
            {withAction && <TableCell align="right">{row.action}</TableCell>}
          </TableRow>
        ))}
        {footer && (
          <TableRow>
            <TableCell colSpan={hasLead ? 2 : 1} sx={{ fontWeight: 600 }}>
              {footer.label}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              {footer.amount}
            </TableCell>
            {withAction && <TableCell />}
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

const Empty = ({ text }: { text: string }) => (
  <Typography variant="body2" color="text.secondary">
    {text}
  </Typography>
)

const LessonGroup = ({ label, lines }: { label: string; lines: PayrollLine[] }) => {
  const [open, setOpen] = useState(false)
  return (
    <Box>
      <Button
        size="small"
        color="inherit"
        onClick={() => setOpen((value) => !value)}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ width: '100%', justifyContent: 'space-between', textTransform: 'none' }}
      >
        <span>
          {label}: {lines.length}
        </span>
        <span>{sumOf(lines)}</span>
      </Button>
      <Collapse in={open}>
        <RecordTable
          rows={lines.map((line, index) => ({
            key: `${line.sourceType}-${line.sourceId}-${index}`,
            lead: line.date ? formatDay(line.date) : '',
            body: (
              <>
                {line.title}
                {line.noRate && <Chip size="small" color="warning" label="без ставки" sx={{ ml: 1 }} />}
              </>
            ),
            amount: formatMoney(line.amount),
          }))}
        />
      </Collapse>
    </Box>
  )
}

const Voided = ({ reason }: { reason: string | null }) => (
  <Chip size="small" label={reason ? `Анульовано: ${reason}` : 'Анульовано'} sx={{ ml: 1 }} />
)

const personName = (person: { lastName: string; firstName: string }) => `${person.lastName} ${person.firstName}`

export const PayrollDetailView = ({
  detail,
  onVoidAdjustment,
  onVoidPayment,
  onVoidExtraHours,
  onVoidAbsence,
  actions,
  showWarnings = true,
}: Props) => {
  const fixed = detail.lines.filter((line) => line.type === 'base' || line.type === 'allowance')
  const lessons = detail.lines.filter((line) => line.type === 'lesson')
  const corrections = detail.lines.filter((line) => line.type === 'correction')
  const extraLines = detail.lines.filter((line) => line.type === 'extra_hours')
  const extraHours = detail.extraHours
  const absences = detail.absences
  const unpaidDays = detail.days.unpaidAbsenceDays ?? 0
  const lessonsOnAbsence = detail.warnings.lessonsOnAbsenceDays ?? []
  const balance = toKopecks(detail.totals.balance)

  return (
    <Stack spacing={2}>
      {showWarnings && detail.warnings.noRate > 0 && (
        <Alert severity="warning">Заняття без ставки: {detail.warnings.noRate}. Ставку можна додати лише в новій версії умов; за минулі заняття нарахуйте доплату вручну.</Alert>
      )}
      {showWarnings && detail.warnings.lessonsWithoutTerms > 0 && (
        <Alert severity="warning">
          Заняття поза періодом умов: {detail.warnings.lessonsWithoutTerms}. Вони не враховані.
        </Alert>
      )}

      {showWarnings && lessonsOnAbsence.length > 0 && (
        <Alert severity="warning">
          Є заняття в дні відсутності: {lessonsOnAbsence.map((day) => formatDay(day)).join(', ')}. Перевірте
          відсутність або запис заняття.
        </Alert>
      )}

      <Section title="Ставка і постійні доплати">
        {fixed.length === 0 ? (
          <Empty text="Немає" />
        ) : (
          <RecordTable
            rows={fixed.map((line, index) => ({
              key: `${line.type}-${index}`,
              body:
                line.type === 'base'
                  ? `Ставка: відпрацьовано ${detail.days.workedDays} з ${detail.days.defaultDays} дн. (норма ${detail.days.normDays})${
                      unpaidDays > 0
                        ? `, неоплачувані відсутності: ${unpaidDays} дн.${
                            detail.days.override ? ' (дні введено вручну, відсутності не враховано)' : ''
                          }`
                        : ''
                    }`
                  : line.title,
              amount: formatMoney(line.amount),
            }))}
          />
        )}
      </Section>

      <Section title="Заняття">
        {lessons.length === 0 ? (
          <Empty text="Проведених занять немає" />
        ) : (
          lessonTypes.map((type) => {
            const group = lessons.filter((line) => line.lessonType === type)
            return group.length > 0 ? (
              <LessonGroup key={type} label={payrollLessonTypeLabels[type]} lines={group} />
            ) : null
          })
        )}
      </Section>

      {(extraHours || extraLines.length > 0 || actions?.extraHours) && (
        <Section title="Додаткові години" action={actions?.extraHours}>
          {extraHours ? (
            extraHours.length === 0 ? (
              <Empty text="Немає" />
            ) : (
              <RecordTable
                withAction={Boolean(onVoidExtraHours)}
                rows={extraHours.map((item, index) => ({
                  key: String(item.id ?? index),
                  voided: Boolean(item.voidedAt),
                  lead: item.date ? formatDay(item.date) : 'за місяць',
                  body: (
                    <>
                      {item.hours} год
                      {item.rate && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          × {formatMoney(item.rate)}
                        </Typography>
                      )}
                      {item.comment ? `, ${item.comment}` : ''}
                      {item.createdBy && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {personName(item.createdBy)}
                        </Typography>
                      )}
                      {item.voidedAt && <Voided reason={item.voidReason ?? null} />}
                    </>
                  ),
                  amount: item.voidedAt ? '' : item.amount === null ? '—' : formatMoney(item.amount),
                  action:
                    onVoidExtraHours && !item.voidedAt && item.id ? (
                      <Button size="small" color="error" onClick={() => onVoidExtraHours(item.id as string)}>
                        Анулювати
                      </Button>
                    ) : null,
                }))}
                footer={{
                  label: 'Разом',
                  amount: (
                    <>
                      {extraLines.some((l) => l.noRate) && (
                        <Chip size="small" color="warning" label="без ставки" sx={{ mr: 1 }} />
                      )}
                      {sumOf(extraLines)}
                    </>
                  ),
                }}
              />
            )
          ) : extraLines.length === 0 ? (
            <Empty text="Немає" />
          ) : (
            <RecordTable
              rows={extraLines.map((line, index) => ({
                key: `${line.sourceId ?? 'extra'}-${index}`,
                body: (
                  <>
                    {line.title}
                    {line.noRate && <Chip size="small" color="warning" label="без ставки" sx={{ ml: 1 }} />}
                  </>
                ),
                amount: formatMoney(line.amount),
              }))}
            />
          )}
        </Section>
      )}

      {absences && (
        <Section title="Відсутності" action={actions?.absences}>
          {absences.length === 0 ? (
            <Empty text="Немає" />
          ) : (
            <RecordTable
              withAction={Boolean(onVoidAbsence)}
              rows={absences.map((item, index) => ({
                key: String(item.id ?? index),
                voided: Boolean(item.voidedAt),
                lead: `${formatDay(item.startDate)}${item.endDate !== item.startDate ? ` – ${formatDay(item.endDate)}` : ''}`,
                body: (
                  <>
                    <Chip
                      size="small"
                      color={item.paid ? 'default' : 'warning'}
                      label={item.paid ? 'Оплачувана' : 'Неоплачувана'}
                      sx={{ mr: 1 }}
                    />
                    {item.reason}
                    {item.workingDays !== undefined && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        робочих днів у місяці: {item.workingDays}
                      </Typography>
                    )}
                    {item.createdBy && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {personName(item.createdBy)}
                      </Typography>
                    )}
                    {item.voidedAt && <Voided reason={item.voidReason} />}
                  </>
                ),
                action:
                  onVoidAbsence && !item.voidedAt ? (
                    <Button size="small" color="error" onClick={() => onVoidAbsence(item.id)}>
                      Анулювати
                    </Button>
                  ) : null,
              }))}
            />
          )}
        </Section>
      )}

      {corrections.length > 0 && (
        <Section title="Коригування попередніх місяців">
          <RecordTable
            rows={corrections.map((line, index) => ({
              key: `${line.sourceId}-${index}`,
              body: (
                <>
                  {line.date ? `${formatDay(line.date)} ` : ''}
                  {line.title}
                  {line.refMonth && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      за {monthLabel(line.refMonth)}
                    </Typography>
                  )}
                </>
              ),
              amount: formatMoney(line.amount),
            }))}
          />
        </Section>
      )}

      <Section title="Разові доплати й утримання">
        {detail.adjustments.length === 0 ? (
          <Empty text="Немає" />
        ) : (
          <RecordTable
            withAction={Boolean(onVoidAdjustment)}
            rows={detail.adjustments.map((item) => ({
              key: item.id,
              voided: Boolean(item.voidedAt),
              body: (
                <>
                  {payrollAdjustmentKindLabels[item.kind]}: {item.reason}
                  {item.createdBy && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {item.createdBy.lastName} {item.createdBy.firstName}
                    </Typography>
                  )}
                  {item.voidedAt && <Voided reason={item.voidReason} />}
                </>
              ),
              amount: `${item.kind === 'deduction' ? '−' : ''}${formatMoney(item.amount)}`,
              action:
                onVoidAdjustment && !item.voidedAt ? (
                  <Button size="small" color="error" onClick={() => onVoidAdjustment(item.id)}>
                    Анулювати
                  </Button>
                ) : null,
            }))}
          />
        )}
      </Section>

      <Section title="Виплати">
        {detail.payments.length === 0 ? (
          <Empty text="Виплат ще немає" />
        ) : (
          <RecordTable
            withAction={Boolean(onVoidPayment)}
            rows={detail.payments.map((item) => ({
              key: item.id,
              voided: Boolean(item.voidedAt),
              lead: formatDay(item.date),
              body: (
                <>
                  {payrollPaymentMethodLabels[item.method]}
                  {item.comment ? `, ${item.comment}` : ''}
                  {item.createdBy && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {item.createdBy.lastName} {item.createdBy.firstName}
                    </Typography>
                  )}
                  {item.voidedAt && <Voided reason={item.voidReason} />}
                </>
              ),
              amount: formatMoney(item.amount),
              action:
                onVoidPayment && !item.voidedAt ? (
                  <Button size="small" color="error" onClick={() => onVoidPayment(item.id)}>
                    Анулювати
                  </Button>
                ) : null,
            }))}
          />
        )}
      </Section>

      <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography>Нараховано</Typography>
          <Typography sx={{ fontWeight: 600 }}>{formatMoney(detail.totals.accrued)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography>Виплачено</Typography>
          <Typography sx={{ fontWeight: 600 }}>{formatMoney(detail.totals.paid)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography>{balance < 0 ? 'Переплата' : 'До виплати'}</Typography>
          <Typography color={balance < 0 ? 'warning.main' : undefined} sx={{ fontWeight: 600 }}>
            {formatMoney(Math.abs(balance) / 100)}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  )
}
