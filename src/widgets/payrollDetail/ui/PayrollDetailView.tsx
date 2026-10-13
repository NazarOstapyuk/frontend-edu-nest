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

interface Props {
  detail: PayrollDetail
  onVoidAdjustment?: (id: string) => void
  onVoidPayment?: (id: string) => void
  showWarnings?: boolean
}

const lessonTypes: PayrollLessonType[] = ['school_lesson', 'class_group', 'individual']

const sumOf = (lines: PayrollLine[]) => formatMoney(lines.reduce((sum, line) => sum + toKopecks(line.amount), 0) / 100)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
)

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
        <Table size="small">
          <TableBody>
            {lines.map((line) => (
              <TableRow key={`${line.sourceType}-${line.sourceId}`}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{line.date ? formatDay(line.date) : ''}</TableCell>
                <TableCell>
                  {line.title}
                  {line.noRate && <Chip size="small" color="warning" label="без ставки" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell align="right">{formatMoney(line.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </Box>
  )
}

const Voided = ({ reason }: { reason: string | null }) => (
  <Chip size="small" label={reason ? `Анульовано: ${reason}` : 'Анульовано'} sx={{ ml: 1 }} />
)

export const PayrollDetailView = ({ detail, onVoidAdjustment, onVoidPayment, showWarnings = true }: Props) => {
  const fixed = detail.lines.filter((line) => line.type === 'base' || line.type === 'allowance')
  const lessons = detail.lines.filter((line) => line.type === 'lesson')
  const corrections = detail.lines.filter((line) => line.type === 'correction')
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

      <Section title="Ставка і постійні доплати">
        {fixed.length === 0 ? (
          <Empty text="Немає" />
        ) : (
          <Table size="small">
            <TableBody>
              {fixed.map((line, index) => (
                <TableRow key={`${line.type}-${index}`}>
                  <TableCell>
                    {line.type === 'base'
                      ? `Ставка: відпрацьовано ${detail.days.workedDays} з ${detail.days.defaultDays} дн. (норма ${detail.days.normDays})`
                      : line.title}
                  </TableCell>
                  <TableCell align="right">{formatMoney(line.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {corrections.length > 0 && (
        <Section title="Коригування попередніх місяців">
          <Table size="small">
            <TableBody>
              {corrections.map((line, index) => (
                <TableRow key={`${line.sourceId}-${index}`}>
                  <TableCell>
                    {line.date ? `${formatDay(line.date)} ` : ''}
                    {line.title}
                    {line.refMonth && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        за {monthLabel(line.refMonth)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{formatMoney(line.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}

      <Section title="Разові доплати й утримання">
        {detail.adjustments.length === 0 ? (
          <Empty text="Немає" />
        ) : (
          <Table size="small">
            <TableBody>
              {detail.adjustments.map((item) => (
                <TableRow key={item.id} sx={{ opacity: item.voidedAt ? 0.6 : 1 }}>
                  <TableCell>
                    {payrollAdjustmentKindLabels[item.kind]}: {item.reason}
                    {item.createdBy && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {item.createdBy.lastName} {item.createdBy.firstName}
                      </Typography>
                    )}
                    {item.voidedAt && <Voided reason={item.voidReason} />}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {item.kind === 'deduction' ? '−' : ''}
                    {formatMoney(item.amount)}
                  </TableCell>
                  {onVoidAdjustment && (
                    <TableCell align="right">
                      {!item.voidedAt && (
                        <Button size="small" color="error" onClick={() => onVoidAdjustment(item.id)}>
                          Анулювати
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title="Виплати">
        {detail.payments.length === 0 ? (
          <Empty text="Виплат ще немає" />
        ) : (
          <Table size="small">
            <TableBody>
              {detail.payments.map((item) => (
                <TableRow key={item.id} sx={{ opacity: item.voidedAt ? 0.6 : 1 }}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDay(item.date)}</TableCell>
                  <TableCell>
                    {payrollPaymentMethodLabels[item.method]}
                    {item.comment ? `, ${item.comment}` : ''}
                    {item.createdBy && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {item.createdBy.lastName} {item.createdBy.firstName}
                      </Typography>
                    )}
                    {item.voidedAt && <Voided reason={item.voidReason} />}
                  </TableCell>
                  <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                  {onVoidPayment && (
                    <TableCell align="right">
                      {!item.voidedAt && (
                        <Button size="small" color="error" onClick={() => onVoidPayment(item.id)}>
                          Анулювати
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
