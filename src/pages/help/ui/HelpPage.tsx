import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import { canAccess, useAuthStore, type SessionProfile } from '../../../entities/user'
import { brandColors } from '../../../shared/assets/brand'
import { matchesSearch } from '../../../shared/lib/search'
import { helpSections, type HelpBlock, type HelpItem, type HelpSection } from '../model/helpContent'
import { HelpAnswer } from './HelpAnswer'

const blockText = (block: HelpBlock) => (block.type === 'paragraph' ? block.text : block.items.join(' '))

const searchText = new Map<string, string>(
  helpSections.flatMap((section) =>
    section.items.map((item): [string, string] => [
      item.id,
      [item.question, ...item.answer.map(blockText), ...(item.images ?? []).map((i) => i.caption)].join(' '),
    ]),
  ),
)

const isAllowed = (profile: SessionProfile | null, tags: Pick<HelpItem, 'roles' | 'areas'>) =>
  (!tags.roles && !tags.areas) ||
  (!!profile && !!tags.roles?.includes(profile.role)) ||
  !!tags.areas?.some((area) => canAccess(profile, area, 'view'))

const visibleSections = (profile: SessionProfile | null): HelpSection[] =>
  helpSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isAllowed(profile, item.roles || item.areas ? item : section)),
    }))
    .filter((section) => section.items.length > 0)

const sectionAnchor = (id: string) => `help-section-${id}`

const scrollToSection = (id: string) => {
  document.getElementById(sectionAnchor(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const idFromHash = (hash: string) => {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''))
  } catch {
    return ''
  }
}

const QuestionAccordion = ({ item, expanded, onToggle }: { item: HelpItem; expanded: boolean; onToggle: () => void }) => (
  <Accordion
    id={item.id}
    expanded={expanded}
    onChange={onToggle}
    disableGutters
    elevation={0}
    square
    slotProps={{ transition: { unmountOnExit: true } }}
    sx={{
      scrollMarginTop: 80,
      bgcolor: 'transparent',
      '&::before': { display: 'none' },
      '& + &': { borderTop: '1px solid', borderColor: 'divider' },
    }}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{ px: { xs: 2, sm: 3 }, minHeight: 56, '& .MuiAccordionSummary-content': { my: 1.5 } }}
    >
      <Typography sx={{ fontWeight: 700 }}>{item.question}</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pt: 0, pb: 2.5 }}>
      <HelpAnswer item={item} />
    </AccordionDetails>
  </Accordion>
)

export const HelpPage = () => {
  const { hash, key } = useLocation()
  const profile = useAuthStore((s) => s.profile)
  const allowedSections = useMemo(() => visibleSections(profile), [profile])
  const itemIds = useMemo(
    () => new Set(allowedSections.flatMap((section) => section.items.map((item) => item.id))),
    [allowedSections],
  )
  const targetId = idFromHash(hash)
  const isTarget = itemIds.has(targetId)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(isTarget ? [targetId] : []))
  const [handledKey, setHandledKey] = useState(key)

  if (key !== handledKey) {
    setHandledKey(key)
    if (isTarget) {
      setQuery('')
      setExpanded((prev) => new Set(prev).add(targetId))
    }
  }

  useEffect(() => {
    if (!isTarget) return
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [targetId, isTarget, key])

  const sections = useMemo(
    () =>
      allowedSections
        .map((section) => ({ ...section, items: section.items.filter((item) => matchesSearch(query, searchText.get(item.id))) }))
        .filter((section) => section.items.length > 0),
    [allowedSections, query],
  )

  const found = sections.reduce((sum, section) => sum + section.items.length, 0)
  const isSearching = query.trim() !== ''

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {isSearching ? `Знайдено: ${found}` : 'Відповіді на часті питання про роботу в системі.'}
        </Typography>
        <TextField
          size="small"
          type="search"
          placeholder="Пошук у довідці"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          gap: 1,
          overflowX: 'auto',
          mb: 3,
          mx: { xs: -1.5, sm: 0 },
          px: { xs: 1.5, sm: 0 },
          pb: 0.5,
        }}
      >
        {sections.map((section) => (
          <Chip
            key={section.id}
            label={section.title}
            variant="outlined"
            onClick={() => scrollToSection(section.id)}
            sx={{ flexShrink: 0, height: 40, borderRadius: '20px' }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        <Box
          component="nav"
          aria-label="Розділи довідки"
          sx={{ display: { xs: 'none', md: 'block' }, width: 240, flexShrink: 0, position: 'sticky', top: 88 }}
        >
          <List dense disablePadding>
            {sections.map((section) => (
              <ListItemButton key={section.id} onClick={() => scrollToSection(section.id)} sx={{ borderRadius: '12px' }}>
                <ListItemText primary={section.title} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {section.items.length}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.length === 0 && (
            <Paper elevation={0} sx={{ borderRadius: '20px', boxShadow: brandColors.outline, p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Нічого не знайдено</Typography>
              <Typography variant="body2" color="text.secondary">
                Спробуйте інше слово, наприклад назву кнопки чи розділу меню.
              </Typography>
            </Paper>
          )}

          {sections.map((section) => (
            <Box component="section" key={section.id} id={sectionAnchor(section.id)} sx={{ scrollMarginTop: 80 }}>
              <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900, mb: 1.5 }}>
                {section.title}
              </Typography>
              <Paper elevation={0} sx={{ borderRadius: '20px', boxShadow: brandColors.outline, overflow: 'hidden' }}>
                {section.items.map((item) => (
                  <QuestionAccordion key={item.id} item={item} expanded={expanded.has(item.id)} onToggle={() => toggle(item.id)} />
                ))}
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
