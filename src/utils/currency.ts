export function convertMXNtoUSD(mxn: number, rate: number): number {
  if (rate <= 0) throw new Error('El tipo de cambio debe ser mayor a cero')
  return mxn / rate
}

export function convertUSDtoMXN(usd: number, rate: number): number {
  if (rate <= 0) throw new Error('El tipo de cambio debe ser mayor a cero')
  return usd * rate
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatMXN(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${formatted} MXN`
}
