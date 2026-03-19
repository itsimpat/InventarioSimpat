const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const day = date.getUTCDate()
  const month = MONTHS_ES[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  return `${day} ${month} ${year}`
}

export function daysUntil(iso: string): number {
  const now = new Date()
  const target = new Date(iso)
  const nowMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const targetMidnight = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate()
  )
  const diffMs = targetMidnight - nowMidnight
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function formatRelative(iso: string): string {
  const days = daysUntil(iso)
  if (days === 0) return 'hoy'
  if (days > 0) {
    if (days === 1) return 'en 1 día'
    if (days < 30) return `en ${days} días`
    if (days < 60) return 'en 1 mes'
    const months = Math.round(days / 30)
    return `en ${months} meses`
  }
  const absDays = Math.abs(days)
  if (absDays === 1) return 'hace 1 día'
  if (absDays < 30) return `hace ${absDays} días`
  if (absDays < 60) return 'hace 1 mes'
  const months = Math.round(absDays / 30)
  return `hace ${months} meses`
}
