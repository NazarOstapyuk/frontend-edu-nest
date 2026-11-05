import { brandColors } from '../../../shared/assets/brand'

const tones = [
  { bg: brandColors.orangeTint, text: brandColors.orangeText },
  { bg: brandColors.oliveTint, text: brandColors.navInk },
  { bg: brandColors.partialBg, text: brandColors.partialText },
  { bg: brandColors.paidBg, text: brandColors.paidText },
]

export const complexToneAt = (index: number) => tones[((index % tones.length) + tones.length) % tones.length]
