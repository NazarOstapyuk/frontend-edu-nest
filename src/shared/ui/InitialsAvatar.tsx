import { Avatar } from '@mui/material'
import { brandColors } from '../assets/brand'

const tints = ['#F9D9C3', '#E3E4D4', '#DCE6EE', '#EAE0EE']

const tintFor = (id: string) => {
  let sum = 0
  for (let i = 0; i < id.length; i += 1) sum = (sum + id.charCodeAt(i)) % 997
  return tints[sum % tints.length]
}

interface InitialsAvatarProps {
  id: string
  firstName: string
  lastName: string
}

export const InitialsAvatar = ({ id, firstName, lastName }: InitialsAvatarProps) => (
  <Avatar
    sx={{
      width: 36,
      height: 36,
      flexShrink: 0,
      bgcolor: tintFor(id),
      color: brandColors.ink,
      fontSize: 13,
      fontWeight: 800,
    }}
  >
    {`${lastName[0] ?? ''}${firstName[0] ?? ''}`}
  </Avatar>
)
