import type { ComplexPrice } from '../../../shared/api'

export const categoryPrices = (prices: ComplexPrice[], categoryId: string, today: string) => {
  const own = prices.filter((p) => p.priceCategoryId === categoryId).sort((a, b) => a.validFrom.localeCompare(b.validFrom))
  const current = own.filter((p) => p.validFrom.slice(0, 10) <= today).pop() ?? null
  const next = own.find((p) => p.validFrom.slice(0, 10) > today) ?? null
  return { current, next }
}
