import { useState } from 'react'
import {
  Alert, Box, Button, ButtonBase, Chip, Dialog, DialogTitle, FormControlLabel, IconButton, Switch, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useMealsStore } from '../model/mealsStore'
import { InstitutionMultiSelect } from './InstitutionMultiSelect'
import { longDate } from '../model/menuDay'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import { addDaysIso, weekStart } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'

const weeksLabel = (n: number) => (n === 1 ? '1 тиждень' : n < 5 ? `${n} тижні` : `${n} тижнів`)

const PREVIEW_LIMIT = 8

export const ApplyTemplateDialog = ({ onClose }: { onClose: () => void }) => {
  const isPhone = useIsPhone()
  const templates = useMealsStore((s) => s.templates)
  const current = useMealsStore((s) => s.menuInstitutionId)
  const menuStart = useMealsStore((s) => s.menuStart)
  const menuWeeks = useMealsStore((s) => s.menuWeeks)
  const isSaving = useMealsStore((s) => s.isSaving)
  const applyTemplate = useMealsStore((s) => s.applyTemplate)
  const push = useNotifyStore((s) => s.push)
  const active = templates.filter((t) => t.active)
  const [templateId, setTemplateId] = useState(active[0]?.id ?? '')
  const [from, setFrom] = useState(menuStart)
  const [to, setTo] = useState(addDaysIso(menuStart, menuWeeks * 7 - 1))
  const [startWeek, setStartWeek] = useState(1)
  const [overwrite, setOverwrite] = useState(false)
  const [institutionIds, setInstitutionIds] = useState<string[]>([current])
  const template = active.find((t) => t.id === templateId)
  const periodValid = Boolean(from && to && to >= from)
  const invalid = institutionIds.length === 0 || !template || !periodValid || startWeek > (template?.weeks ?? 0)

  const mondays: string[] = []
  if (periodValid) {
    for (let m = weekStart(from); m <= to && mondays.length <= PREVIEW_LIMIT; m = addDaysIso(m, 7)) mondays.push(m)
  }
  const cycleWeek = (index: number) => (template ? ((startWeek - 1 + index) % template.weeks) + 1 : 1)
  const setPeriodWeeks = (n: number) => {
    const start = weekStart(from || menuStart)
    setFrom(start)
    setTo(addDaysIso(start, n * 7 - 3))
  }

  const submit = () =>
    applyTemplate(templateId, { institutionIds, from, to, startWeek, overwrite })
      .then((r) => {
        push(`Готово: створено ${r.created}, перезаписано ${r.overwritten}, пропущено ${r.skipped}. Перевірте дні й опублікуйте меню.`, 'success')
        onClose()
      })
      .catch(() => undefined)

  return (
    <Dialog fullScreen={isPhone} open fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, pr: 7 }}>
        Заповнити меню з шаблону
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Страви з шаблону ляжуть на вибрані дати як чернетки. Батьки побачать меню після публікації.
        </Typography>
        <IconButton aria-label="Закрити" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: 3, pb: 3 }}>
        {active.length === 0 ? (
          <Alert severity="info">
            Немає шаблонів, позначених «Використовується». Створіть або увімкніть шаблон на вкладці «Шаблони».
          </Alert>
        ) : (
          <>
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>1. Шаблон</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
                {active.map((t) => {
                  const selected = t.id === templateId
                  return (
                    <ButtonBase
                      key={t.id}
                      onClick={() => { setTemplateId(t.id); setStartWeek(1) }}
                      aria-pressed={selected}
                      sx={{
                        display: 'block', textAlign: 'left', p: 1.5, borderRadius: 1.5, border: '1px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        boxShadow: selected ? (theme) => `0 0 0 1px ${theme.palette.primary.main}` : 'none',
                        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Цикл на {weeksLabel(t.weeks)}</Typography>
                    </ButtonBase>
                  )
                })}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>2. На які дати</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                {[1, 4, 8].map((n) => (
                  <Chip key={n} label={`${weeksLabel(n)} з ${longDate(weekStart(from || menuStart))}`} onClick={() => setPeriodWeeks(n)} variant="outlined" />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField type="date" label="З" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1, minWidth: 180 }} />
                <TextField
                  type="date"
                  label="По"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  error={Boolean(from && to && to < from)}
                  helperText={from && to && to < from ? 'Кінець раніше за початок' : ' '}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1, minWidth: 180 }}
                />
              </Box>
            </Box>

            {template && (
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>3. З якого тижня шаблону почати</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Перший тиждень періоду отримає вибраний тиждень шаблону, далі цикл іде по колу.
                </Typography>
                <ToggleButtonGroup exclusive size="small" value={startWeek} onChange={(_, v: number | null) => v && setStartWeek(v)} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                  {Array.from({ length: template.weeks }, (_, i) => i + 1).map((w) => (
                    <ToggleButton key={w} value={w} sx={{ px: 2 }}>Тиждень {w}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
                {mondays.length > 0 && (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                    {mondays.slice(0, PREVIEW_LIMIT).map((monday, i) => (
                      <Box
                        key={monday}
                        sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1.5, py: 0.75, flexWrap: 'wrap', borderTop: i ? '1px solid' : 0, borderColor: 'divider', bgcolor: i % 2 ? 'grey.50' : 'background.paper' }}
                      >
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {longDate(monday)} – {longDate(addDaysIso(monday, 6))}
                        </Typography>
                        <Chip size="small" color="primary" variant={i === 0 ? 'filled' : 'outlined'} label={`Тиждень ${cycleWeek(i)} шаблону`} />
                      </Box>
                    ))}
                    {mondays.length > PREVIEW_LIMIT && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
                        І далі по колу до {longDate(to)}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>4. Для яких закладів</Typography>
              <InstitutionMultiSelect label="Заклади" value={institutionIds} onChange={setInstitutionIds} currentId={current} />
            </Box>

            <Box>
              <FormControlLabel
                control={<Switch checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />}
                label="Замінити наявні чернетки"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 6 }}>
                Без цього дні, де вже є чернетка, залишаться як є. Опубліковані й неробочі дні не змінюються ніколи.
              </Typography>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button onClick={onClose} color="inherit">Скасувати</Button>
          <Button onClick={submit} variant="contained" disabled={isSaving || invalid}>Створити чернетки</Button>
        </Box>
      </Box>
    </Dialog>
  )
}
