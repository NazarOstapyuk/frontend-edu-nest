import { useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import { useCan } from '../../../entities/user'
import { HistoryDialog } from './HistoryDialog'

interface Props {
  entityType: string
  entityId: string
  title: string
}

export const HistoryButton = ({ entityType, entityId, title }: Props) => {
  const canView = useCan('audit', 'view')
  const [open, setOpen] = useState(false)
  if (!canView) return null

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Історія">
        <IconButton size="small" onClick={() => setOpen(true)}>
          <HistoryIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {open && (
        <HistoryDialog
          open={open}
          onClose={() => setOpen(false)}
          entityType={entityType}
          entityId={entityId}
          title={title}
        />
      )}
    </span>
  )
}
