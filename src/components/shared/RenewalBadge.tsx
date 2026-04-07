import { daysUntil } from '../../utils/dates'

interface Props {
  fecha: string
}

export function RenewalBadge({ fecha }: Props) {
  const days = daysUntil(fecha)
  const colorClass =
    days < 7
      ? 'bg-red-100 text-red-800'
      : days <= 30
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800'

  const label =
    days < 0
      ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
      : days === 0
      ? 'Expires today'
      : days === 1
      ? 'Expires in 1 day'
      : `Expires in ${days} days`

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
