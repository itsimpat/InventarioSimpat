const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDate(iso: string): string {
  const date = new Date(iso)
  const day = date.getUTCDate()
  const month = MONTHS[date.getUTCMonth()]
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
  if (days === 0) return 'today'
  if (days > 0) {
    if (days === 1) return 'in 1 day'
    if (days < 30) return `in ${days} days`
    if (days < 60) return 'in 1 month'
    const months = Math.round(days / 30)
    return `in ${months} months`
  }
  const absDays = Math.abs(days)
  if (absDays === 1) return '1 day ago'
  if (absDays < 30) return `${absDays} days ago`
  if (absDays < 60) return '1 month ago'
  const months = Math.round(absDays / 30)
  return `${months} months ago`
}
