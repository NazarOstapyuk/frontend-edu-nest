import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  formatDay,
  localToday,
  normalizeAmount,
  payrollApi,
  payrollCalendarLabels,
  payrollLessonTypeLabels,
  toKopecks,
  type PayrollCalendar,
  type PayrollLessonType,
  type SalaryRateDto,
  type SalaryTerms,
} from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { usePayrollStore } from '../model/payrollStore'

const calendars = Object.keys(payrollCalendarLabels) as PayrollCalendar[]
const lessonTypes = Object.keys(payrollLessonTypeLabels) as PayrollLessonType[]
const AMOUNT = /^\d{1,8}([.,]\d{1,2})?$/

const amount = () => yup.string().trim().required('Вкажіть суму').matches(AMOUNT, 'Неправильна сума')

const schema = yup.object({
  validFrom: yup.string().required('Вкажіть дату'),
  monthlyRate: amount(),
  extraHourRate: yup
    .string()
    .trim()
    .default('')
    .matches(AMOUNT, { message: 'Неправильна сума', excludeEmptyString: true })
    .test('positive', 'Сума має бути більшою за 0', (value) => !value || !AMOUNT.test(value) || toKopecks(value) > 0),
  calendarKind: yup.mixed<PayrollCalendar>().oneOf(calendars).required(),
  note: yup.string().trim().max(500, 'Не більше 500 символів').default(''),
  rates: yup
    .array(
      yup.object({
        lessonType: yup.mixed<PayrollLessonType>().oneOf(lessonTypes).required(),
        targetId: yup.string().default(''),
        amount: amount(),
      }),
    )
    .required(),
  allowances: yup
    .array(
      yup.object({
        name: yup.string().trim().required('Вкажіть назву').max(100, 'Не більше 100 символів'),
        amount: amount().test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0),
      }),
    )
    .required(),
})

type FormValues = yup.InferType<typeof schema>

interface Props {
  teacherId: string
  terms: SalaryTerms | null
  prefill?: SalaryTerms | null
  onClose: () => void
}

const toDefaults = (terms: SalaryTerms | null, prefill: SalaryTerms | null): FormValues => {
  const source = terms ?? prefill
  return source
    ? {
        validFrom: terms ? terms.validFrom : localToday(),
        monthlyRate: source.monthlyRate,
        extraHourRate: source.extraHourRate ?? '',
        calendarKind: source.calendarKind,
        note: source.note ?? '',
        rates: source.rates.map((rate) => ({
          lessonType: rate.lessonType,
          targetId: rate.subjectId ?? rate.classGroupId ?? '',
          amount: rate.amount,
        })),
        allowances: source.allowances.map((allowance) => ({ name: allowance.name, amount: allowance.amount })),
      }
    : { validFrom: localToday(), monthlyRate: '0', extraHourRate: '', calendarKind: 'all', note: '', rates: [], allowances: [] }
}

const toRate = (rate: FormValues['rates'][number]): SalaryRateDto => ({
  lessonType: rate.lessonType,
  amount: normalizeAmount(rate.amount),
  ...(rate.targetId
    ? rate.lessonType === 'school_lesson'
      ? { subjectId: rate.targetId }
      : { classGroupId: rate.targetId }
    : {}),
})

export const TermsDialog = ({ teacherId, terms, prefill = null, onClose }: Props) => {
  const isPhone = useIsPhone()
  const subjects = usePayrollStore((s) => s.subjects)
  const classGroups = usePayrollStore((s) => s.classGroups)
  const runTerms = usePayrollStore((s) => s.runTerms)
  const isSaving = usePayrollStore((s) => s.isSaving)
  const { control, handleSubmit, setValue } = useForm<FormValues>({
    mode: 'all',
    resolver: yupResolver(schema),
    defaultValues: toDefaults(terms, prefill),
  })
  const rateFields = useFieldArray({ control, name: 'rates' })
  const allowanceFields = useFieldArray({ control, name: 'allowances' })
  const rates = useWatch({ control, name: 'rates' })

  const targets = (lessonType: PayrollLessonType, current: string) =>
    lessonType === 'school_lesson'
      ? subjects.filter((s) => s.active || s.id === current).map((s) => ({ id: s.id, name: s.name }))
      : classGroups.filter((g) => (g.active || g.id === current) && (lessonType === 'individual') === (g.format === 'individual'))

  const onSubmit = (values: FormValues) => {
    const payload = {
      monthlyRate: normalizeAmount(values.monthlyRate),
      calendarKind: values.calendarKind,
      note: values.note,
      rates: values.rates.map(toRate),
      allowances: values.allowances.map((a) => ({ name: a.name, amount: normalizeAmount(a.amount) })),
    }
    const extraHourRate = values.extraHourRate ? normalizeAmount(values.extraHourRate) : null
    const action = terms
      ? () => payrollApi.updateTerms(terms.id, { ...payload, extraHourRate })
      : () =>
          payrollApi.createTerms({
            ...payload,
            ...(extraHourRate ? { extraHourRate } : {}),
            teacherId,
            validFrom: values.validFrom,
          })
    runTerms(action).then(onClose).catch(() => undefined)
  }

  return (
    <Dialog fullScreen={isPhone} open fullWidth maxWidth="md" onClose={onClose}>
      <DialogTitle>{terms ? 'Редагувати умови' : 'Нова версія умов'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {!terms && prefill && (
            <Alert severity="info">
              Умови скопійовано з версії від {formatDay(prefill.validFrom)}. Змініть потрібне й вкажіть дату початку.
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="validFrom"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Діє з"
                  disabled={!!terms}
                  error={!!error}
                  helperText={error?.message ?? (terms ? undefined : 'Попередня версія закриється напередодні')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              )}
            />
            <Controller
              name="monthlyRate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField {...field} label="Місячна ставка, грн" error={!!error} helperText={error?.message} fullWidth />
              )}
            />
            <Controller
              name="extraHourRate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Ставка за додаткову годину, грн"
                  error={!!error}
                  helperText={error?.message ?? 'Порожньо — додаткові години не оплачуються за умовами'}
                  fullWidth
                />
              )}
            />
            <Controller
              name="calendarKind"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Календар робочих днів" fullWidth>
                  {calendars.map((kind) => (
                    <MenuItem key={kind} value={kind}>
                      {payrollCalendarLabels[kind]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Примітка" error={!!error} helperText={error?.message} fullWidth />
            )}
          />
          <Box>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="subtitle2">Ставки за заняття</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => rateFields.append({ lessonType: 'school_lesson', targetId: '', amount: '' })}
              >
                Додати ставку
              </Button>
            </Stack>
            {rateFields.fields.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Ставок немає: заняття рахуватимуться з сумою 0.
              </Typography>
            )}
            {rateFields.fields.map((item, index) => {
              const lessonType = rates?.[index]?.lessonType ?? 'school_lesson'
              const current = rates?.[index]?.targetId ?? ''
              return (
                <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                  <Controller
                    name={`rates.${index}.lessonType`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        select
                        size="small"
                        label="Тип"
                        sx={{ minWidth: { sm: 200 } }}
                        value={field.value}
                        onChange={(event) => {
                          field.onChange(event.target.value)
                          setValue(`rates.${index}.targetId`, '')
                        }}
                      >
                        {lessonTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {payrollLessonTypeLabels[type]}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Controller
                    name={`rates.${index}.targetId`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        size="small"
                        label={lessonType === 'school_lesson' ? 'Предмет' : 'Гурток'}
                        sx={{ minWidth: { sm: 220 }, flex: 1 }}
                      >
                        <MenuItem value="">Усі</MenuItem>
                        {targets(lessonType, current).map((target) => (
                          <MenuItem key={target.id} value={target.id}>
                            {target.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Controller
                    name={`rates.${index}.amount`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        size="small"
                        label="Сума, грн"
                        error={!!error}
                        helperText={error?.message}
                        sx={{ width: { sm: 140 } }}
                      />
                    )}
                  />
                  <IconButton aria-label="Видалити ставку" sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }} onClick={() => rateFields.remove(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )
            })}
          </Box>
          <Box>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="subtitle2">Постійні доплати (щомісяця)</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => allowanceFields.append({ name: '', amount: '' })}>
                Додати доплату
              </Button>
            </Stack>
            {allowanceFields.fields.map((item, index) => (
              <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                <Controller
                  name={`allowances.${index}.name`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      size="small"
                      label="Назва"
                      error={!!error}
                      helperText={error?.message}
                      sx={{ flex: 1 }}
                    />
                  )}
                />
                <Controller
                  name={`allowances.${index}.amount`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      size="small"
                      label="Сума, грн"
                      error={!!error}
                      helperText={error?.message}
                      sx={{ width: { sm: 140 } }}
                    />
                  )}
                />
                <IconButton aria-label="Видалити доплату" sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }} onClick={() => allowanceFields.remove(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button variant="contained" disabled={isSaving} onClick={handleSubmit(onSubmit)}>
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  )
}
