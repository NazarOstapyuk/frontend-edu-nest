import { Box, Chip, Paper, Typography } from '@mui/material'
import { formatDay, lessonStatusLabels, nushLevelLabels, nushLevels, type ParentLessons } from '../../../shared/api'

export const LessonsBlock = ({ lessons }: { lessons: ParentLessons }) => {
  const missed = lessons.lessons.filter((l) => l.status === 'absent')
  const levels = lessons.lessons.filter((l) => l.level)
  if (lessons.lessons.length === 0) return null
  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
      <Typography sx={{ fontWeight: 600, mb: 1 }}>Уроки</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Chip variant="outlined" color="error" label={`Пропущено уроків: ${lessons.summary.missed}`} />
        <Chip variant="outlined" color="warning" label={`З поважної причини: ${lessons.summary.missedExcused}`} />
      </Box>
      {missed.map((l) => (
        <Typography key={`${l.date}-${l.period}`} variant="body2">
          {formatDay(l.date)}, {l.period}-й урок, {l.subjectName}: {lessonStatusLabels[l.status]}{l.reasonName ? `, ${l.reasonName}` : ''}
        </Typography>
      ))}
      {lessons.summary.bySubject.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Оцінювання (НУШ)</Typography>
          {lessons.summary.bySubject.map((s) => (
            <Typography key={s.subjectName} variant="body2">
              {s.subjectName}: {nushLevels.filter((l) => s.levels[l] > 0).map((l) => `${nushLevelLabels[l]} — ${s.levels[l]}`).join('; ')}
            </Typography>
          ))}
        </Box>
      )}
      {levels.filter((l) => l.comment).map((l) => (
        <Typography key={`c-${l.date}-${l.period}`} variant="body2" color="text.secondary">
          {formatDay(l.date)}, {l.subjectName}: {l.comment}
        </Typography>
      ))}
    </Paper>
  )
}
