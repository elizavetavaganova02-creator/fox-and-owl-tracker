export function formatCurrency(amount, currency) {
  try {
    const number = Number(amount) || 0
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(number)
  } catch {
    return `${Number(amount || 0).toLocaleString('ru-RU')} ${currency}`
  }
}
