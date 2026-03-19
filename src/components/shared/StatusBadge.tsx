type Props = {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_STYLES: Record<string, string> = {
  'Asignado': 'bg-green-100 text-green-800',
  'En Bodega': 'bg-gray-100 text-gray-700',
  'En Reparación': 'bg-yellow-100 text-yellow-800',
  'Vendido': 'bg-blue-100 text-blue-800',
  'Dado de Baja': 'bg-red-100 text-red-800',
  'Solicitado': 'bg-orange-100 text-orange-800',
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const colorClass = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}
    >
      {status}
    </span>
  )
}
