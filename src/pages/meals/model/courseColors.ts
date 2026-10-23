const palette = [
  { dot: '#5c6bc0', text: '#3949ab' },
  { dot: '#26a69a', text: '#00796b' },
  { dot: '#ef6c00', text: '#d84315' },
  { dot: '#ab47bc', text: '#7b1fa2' },
  { dot: '#8d6e63', text: '#5d4037' },
  { dot: '#29b6f6', text: '#0277bd' },
  { dot: '#9ccc65', text: '#558b2f' },
  { dot: '#ec407a', text: '#c2185b' },
]

export const courseColorAt = (index: number) => palette[((index % palette.length) + palette.length) % palette.length]
