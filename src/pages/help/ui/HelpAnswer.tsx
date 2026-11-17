import { Box, Button, Typography } from '@mui/material'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import LinkIcon from '@mui/icons-material/Link'
import { brandColors } from '../../../shared/assets/brand'
import { useNotifyStore } from '../../../shared/model/notifyStore'
import type { HelpBlock, HelpItem } from '../model/helpContent'
import { HelpImageFigure } from './HelpImageFigure'

const copyLink = async (id: string) => {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/help#${id}`)
    useNotifyStore.getState().push('Посилання скопійовано', 'success')
  } catch {
    useNotifyStore.getState().push('Не вдалося скопіювати посилання')
  }
}

const Block = ({ block }: { block: HelpBlock }) => {
  if (block.type === 'paragraph') return <Typography>{block.text}</Typography>

  if (block.type === 'steps') {
    return (
      <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {block.items.map((text, index) => (
          <Box component="li" key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                width: 26,
                height: 26,
                borderRadius: '50%',
                bgcolor: brandColors.orangeTint,
                color: brandColors.orangeText,
                fontSize: 13,
                fontWeight: 800,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {index + 1}
            </Box>
            <Typography sx={{ pt: '1px' }}>{text}</Typography>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, bgcolor: brandColors.oliveTint, borderRadius: '14px', p: { xs: 1.5, sm: 2 } }}>
      <LightbulbOutlinedIcon sx={{ color: brandColors.inkOnOliveSoft, flexShrink: 0, mt: '1px' }} fontSize="small" />
      <Box
        component="ul"
        sx={{ m: 0, p: 0, pl: block.items.length > 1 ? 2.25 : 0, listStyle: block.items.length > 1 ? 'disc' : 'none', display: 'flex', flexDirection: 'column', gap: 0.75 }}
      >
        {block.items.map((text, index) => (
          <Typography component="li" variant="body2" key={index} sx={{ color: brandColors.inkOnOliveSoft }}>
            {text}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

export const HelpAnswer = ({ item }: { item: HelpItem }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {item.answer.map((block, index) => (
      <Block key={index} block={block} />
    ))}
    {item.images && item.images.length > 0 && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {item.images.map((image) => (
          <HelpImageFigure key={image.src} image={image} />
        ))}
      </Box>
    )}
    <Box>
      <Button size="small" color="inherit" startIcon={<LinkIcon />} onClick={() => copyLink(item.id)} sx={{ color: 'text.secondary' }}>
        Скопіювати посилання
      </Button>
    </Box>
  </Box>
)
