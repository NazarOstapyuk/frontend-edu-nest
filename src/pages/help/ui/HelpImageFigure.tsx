import { useState } from 'react'
import { Box, ButtonBase, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { brandColors } from '../../../shared/assets/brand'
import type { HelpImage } from '../model/helpContent'

export const HelpImageFigure = ({ image }: { image: HelpImage }) => {
  const isPhone = useIsPhone()
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  if (failed) return null

  return (
    <Box component="figure" sx={{ m: 0, display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 720 }}>
      <ButtonBase
        onClick={() => setOpen(true)}
        aria-label={`Збільшити: ${image.caption}`}
        sx={{ display: 'block', borderRadius: '14px', overflow: 'hidden', boxShadow: brandColors.outline, alignSelf: 'flex-start', maxWidth: '100%' }}
      >
        <Box
          component="img"
          src={image.src}
          alt={image.caption}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          sx={{ display: 'block', maxWidth: '100%', maxHeight: 420, height: 'auto', bgcolor: brandColors.ground }}
        />
      </ButtonBase>
      <Typography component="figcaption" variant="body2" color="text.secondary">
        {image.caption}
      </Typography>

      <Dialog open={open} onClose={() => setOpen(false)} fullScreen={isPhone} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
          <Box component="span" sx={{ flex: 1, fontSize: 16, fontWeight: 800 }}>
            {image.caption}
          </Box>
          <IconButton aria-label="Закрити" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', p: { xs: 1, sm: 2 } }}>
          <Box
            component="img"
            src={image.src}
            alt={image.caption}
            sx={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: '14px', boxShadow: brandColors.outline }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
