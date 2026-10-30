import { useEffect, useState } from 'react'
import { Autocomplete, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useAuthStore, useCan } from '../../../entities/user'
import {
  childrenApi,
  groupsApi,
  softList,
  usersApi,
  type Child,
  type Group,
  type UserLookup,
  type ReportDefinition,
  type ReportFilter,
  type ReportQuery,
} from '../../../shared/api'
import { useEffectiveInstitutions, useInstitutionStore } from '../../../shared/model/institutionStore'
import { useReportsStore } from '../model/reportsStore'

const dayString = (date: Date) => date.toISOString().slice(0, 10)

const kyivToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date())

const parseDay = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000)

const presets: { label: string; range: () => { from: string; to: string } }[] = [
  {
    label: 'Сьогодні',
    range: () => {
      const today = kyivToday()
      return { from: today, to: today }
    },
  },
  {
    label: 'Цей тиждень',
    range: () => {
      const today = parseDay(kyivToday())
      const monday = addDays(today, -((today.getUTCDay() + 6) % 7))
      return { from: dayString(monday), to: dayString(addDays(monday, 6)) }
    },
  },
  {
    label: 'Цей місяць',
    range: () => {
      const today = parseDay(kyivToday())
      const y = today.getUTCFullYear()
      const m = today.getUTCMonth()
      return {
        from: dayString(new Date(Date.UTC(y, m, 1))),
        to: dayString(new Date(Date.UTC(y, m + 1, 0))),
      }
    },
  },
  {
    label: 'Минулий місяць',
    range: () => {
      const today = parseDay(kyivToday())
      const y = today.getUTCFullYear()
      const m = today.getUTCMonth()
      return {
        from: dayString(new Date(Date.UTC(y, m - 1, 1))),
        to: dayString(new Date(Date.UTC(y, m, 0))),
      }
    },
  },
]

export const ReportFilters = ({ definition }: { definition: ReportDefinition }) => {
  const profile = useAuthStore((s) => s.profile)
  const query = useReportsStore((s) => s.query)
  const loading = useReportsStore((s) => s.loading)
  const downloading = useReportsStore((s) => s.downloading)
  const setQuery = useReportsStore((s) => s.setQuery)
  const load = useReportsStore((s) => s.load)
  const download = useReportsStore((s) => s.download)
  const institutions = useEffectiveInstitutions()
  const selectedInstitutionId = useInstitutionStore((s) => s.selectedId)
  const [groups, setGroups] = useState<Group[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [teachers, setTeachers] = useState<UserLookup[]>([])

  const canListGroups = useCan('children', 'view')
  const canListChildren = useCan('children', 'view')

  const available: Record<ReportFilter, boolean> = {
    institution: true,
    kind: true,
    group: canListGroups,
    child: canListChildren,
    teacher: true,
  }
  const has = (filter: ReportFilter) => definition.filters.includes(filter) && available[filter]
  const showInstitution = has('institution')
  const showGroup = has('group')
  const showChild = has('child')
  const showTeacher = has('teacher')
  const canPickKind = profile?.role === 'root' || profile?.accessScope === 'all'

  useEffect(() => {
    let stale = false
    if (showGroup) {
      softList(groupsApi.getList()).then((list) => {
        if (!stale) setGroups(list)
      })
    }
    if (showChild) {
      softList(childrenApi.getList()).then((list) => {
        if (!stale) setChildren(list)
      })
    }
    if (showTeacher) {
      softList(usersApi.lookup('teacher', true)).then((list) => {
        if (!stale) setTeachers(list)
      })
    }
    return () => {
      stale = true
    }
  }, [showGroup, showChild, showTeacher])

  useEffect(() => {
    if (showInstitution) setQuery({ institutionId: selectedInstitutionId ?? undefined, ...(selectedInstitutionId ? { kind: undefined } : {}) })
  }, [showInstitution, selectedInstitutionId, setQuery])

  const matchesGroup = (g: Group | null, q: ReportQuery) =>
    !!g &&
    (!q.institutionId || g.institution.id === q.institutionId) &&
    (!q.kind || g.kind === q.kind) &&
    (!q.groupId || g.id === q.groupId)
  const update = (partial: Partial<ReportQuery>) => {
    const next = { ...query, ...partial }
    if (partial.institutionId !== undefined && next.groupId && !groups.some((g) => g.id === next.groupId && matchesGroup(g, { ...next, groupId: undefined }))) {
      next.groupId = undefined
      partial = { ...partial, groupId: undefined }
    }
    const scopeChanged = 'institutionId' in partial || 'groupId' in partial || 'kind' in partial
    if (scopeChanged && next.childId && !children.some((c) => c.id === next.childId && matchesGroup(c.group, next))) {
      partial = { ...partial, childId: undefined }
    }
    setQuery(partial)
  }
  const visibleGroups = groups.filter((g) => matchesGroup(g, { ...query, groupId: undefined }))
  const visibleChildren = children.filter((c) => matchesGroup(c.group, query))
  const busy = loading || downloading

  return (
    <Stack spacing={2}>
      {definition.period && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {presets.map((preset) => (
            <Button key={preset.label} size="small" variant="outlined" onClick={() => update(preset.range())}>
              {preset.label}
            </Button>
          ))}
        </Stack>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        {definition.period && (
          <>
            <TextField
              label="Від"
              type="date"
              size="small"
              value={query.from ?? ''}
              onChange={(e) => update({ from: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: query.to } }}
            />
            <TextField
              label="До"
              type="date"
              size="small"
              value={query.to ?? ''}
              onChange={(e) => update({ to: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: query.from } }}
            />
          </>
        )}
        {showInstitution && (
          <TextField
            select
            label="Заклад"
            size="small"
            sx={{ minWidth: { sm: 180 } }}
            value={query.institutionId ?? ''}
            onChange={(e) => update({ institutionId: e.target.value || undefined, ...(e.target.value ? { kind: undefined } : {}) })}
            helperText={definition.key === 'lessons' ? 'Не впливає на уроки гуртків' : undefined}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Усі заклади</MenuItem>
            {institutions.map((i) => (
              <MenuItem key={i.id} value={i.id}>
                {i.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {has('kind') && canPickKind && !query.institutionId && (
          <TextField
            select
            label="Тип групи"
            size="small"
            sx={{ minWidth: { sm: 140 } }}
            value={query.kind ?? ''}
            onChange={(e) =>
              update({
                kind: (e.target.value || undefined) as ReportQuery['kind'],
                groupId: undefined,
              })
            }
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Усі</MenuItem>
            <MenuItem value="kindergarten">Садок</MenuItem>
            <MenuItem value="school_class">Школа</MenuItem>
          </TextField>
        )}
        {has('group') && (
          <Autocomplete
            size="small"
            sx={{ minWidth: { sm: 220 } }}
            options={visibleGroups}
            getOptionLabel={(g) => (query.institutionId ? g.name : `${g.institution.name}, ${g.name}`)}
            value={visibleGroups.find((g) => g.id === query.groupId) ?? null}
            onChange={(_, group) => update({ groupId: group?.id })}
            renderInput={(params) => <TextField {...params} label="Група" />}
          />
        )}
        {has('child') && (
          <Autocomplete
            size="small"
            sx={{ minWidth: { sm: 240 } }}
            options={visibleChildren}
            getOptionLabel={(c) => `${c.lastName} ${c.firstName}`}
            value={visibleChildren.find((c) => c.id === query.childId) ?? null}
            onChange={(_, child) => update({ childId: child?.id })}
            renderInput={(params) => <TextField {...params} label="Дитина" />}
          />
        )}
        {has('teacher') && (
          <Autocomplete
            size="small"
            sx={{ minWidth: { sm: 240 } }}
            options={teachers}
            getOptionLabel={(u) => `${u.lastName} ${u.firstName}${u.isActive ? '' : ' (неактивний)'}`}
            value={teachers.find((u) => u.id === query.teacherId) ?? null}
            onChange={(_, teacher) => update({ teacherId: teacher?.id })}
            renderInput={(params) => <TextField {...params} label="Вчитель" />}
          />
        )}
        <Button variant="contained" disabled={busy} onClick={() => load()}>
          Сформувати
        </Button>
        <Button variant="outlined" disabled={busy} onClick={() => download()}>
          Завантажити Excel
        </Button>
      </Stack>
    </Stack>
  )
}
