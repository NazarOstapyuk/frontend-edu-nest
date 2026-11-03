const normalize = (value: string) => value.toLocaleLowerCase('uk').replace(/[’ʼ`]/g, "'").replace(/\s+/g, ' ').trim()

export const matchesSearch = (query: string, ...values: (string | null | undefined)[]) => {
  const words = normalize(query).split(' ').filter(Boolean)
  if (words.length === 0) return true
  const text = normalize(values.filter(Boolean).join(' '))
  return words.every((word) => text.includes(word))
}
