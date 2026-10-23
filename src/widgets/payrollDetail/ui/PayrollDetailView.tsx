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
  onVoidExtraHours?: (id: string) => void
  onVoidAbsence?: (id: string) => void
  actions?: { extraHours?: ReactNode; absences?: ReactNode }
  showWarnings?: boolean
}

const lessonTypes: PayrollLessonType[] = ['school_lesson', 'class_group', 'individual']

const sumOf = (lines: PayrollLine[]) => formatMoney(lines.reduce((sum, line) => sum + toKopecks(line.amount), 0) / 100)

const Section = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <Box>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
      <Typography variant="subtitle2">{title}</Typography>
      {action}
    </Stack>
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
          <Table size="small">
            <TableBody>
              {fixed.map((line, index) => (
                <TableRow key={`${line.type}-${index}`}>
                  <TableCell>
                    {line.type === 'base'
                      ? `Ставка: відпрацьовано ${detail.days.workedDays} з ${detail.days.defaultDays} дн. (норма ${detail.days.normDays})${
                          unpaidDays > 0
                            ? `, неоплачувані відсутності: ${unpaidDays} дн.${
                                detail.days.override ? ' (дні введено вручну, відсутності не враховано)' : ''
                              }`
                            : ''
                        }`
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

      {(extraHours || extraLines.length > 0 || actions?.extraHours) && (
        <Section title="Додаткові години" action={actions?.extraHours}>
          {extraHours ? (
            extraHours.length === 0 ? (
              <Empty text="Немає" />
            ) : (
              <Table size="small">
                <TableBody>
                  {extraHours.map((item, index) => (
                    <TableRow key={item.id ?? index} sx={{ opacity: item.voidedAt ? 0.6 : 1 }}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.date ? formatDay(item.date) : 'за місяць'}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {item.voidedAt ? '' : item.amount === null ? '—' : formatMoney(item.amount)}
                      </TableCell>
                      {onVoidExtraHours && (
                        <TableCell align="right">
                          {!item.voidedAt && item.id && (
                            <Button size="small" color="error" onClick={() => onVoidExtraHours(item.id as string)}>
                              Анулювати
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                      Разом
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {extraLines.some((l) => l.noRate) && <Chip size="small" color="warning" label="без ставки" sx={{ mr: 1 }} />}
                      {sumOf(extraLines)}
                    </TableCell>
                    {onVoidExtraHours && <TableCell />}
                  </TableRow>
                </TableBody>
              </Table>
            )
          ) : extraLines.length === 0 ? (
            <Empty text="Немає" />
          ) : (
            <Table size="small">
              <TableBody>
                {extraLines.map((line, index) => (
                  <TableRow key={`${line.sourceId ?? 'extra'}-${index}`}>
                    <TableCell>
                      {line.title}
                      {line.noRate && <Chip size="small" color="warning" label="без ставки" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell align="right">{formatMoney(line.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      )}

      {absences && (
        <Section title="Відсутності" action={actions?.absences}>
          {absences.length === 0 ? (
            <Empty text="Немає" />
          ) : (
            <Table size="small">
              <TableBody>
                {absences.map((item, index) => (
                  <TableRow key={item.id ?? index} sx={{ opacity: item.voidedAt ? 0.6 : 1 }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatDay(item.startDate)}
                      {item.endDate !== item.startDate ? ` – ${formatDay(item.endDate)}` : ''}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    {onVoidAbsence && (
                      <TableCell align="right">
                        {!item.voidedAt && (
                          <Button size="small" color="error" onClick={() => onVoidAbsence(item.id)}>
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
      )}

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
