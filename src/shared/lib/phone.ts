export const PHONE_PATTERN = /^\+380\d{9}$/

export const normalizePhone = (input: string): string => {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('380')) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('0')) return `+38${digits}`
  if (digits.length === 9) return `+380${digits}`
  return input.trim()
}

export const isValidPhone = (value: string) => PHONE_PATTERN.test(value)
