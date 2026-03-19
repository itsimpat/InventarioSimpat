import { useIYBudgetSummary } from '../../hooks/useIYBudgetSummary'
import { formatUSD } from '../../utils/currency'

type Props = {
  collaboratorId: string
  compact?: boolean
}

function ProgressBar({ pct }: { pct: number }) {
  const barColor =
    pct >= 100
      ? 'bg-red-500'
      : pct >= 80
      ? 'bg-yellow-400'
      : 'bg-green-500'

  return (
    <div className="w-full bg-gray-200 rounded-full overflow-hidden" style={{ height: '6px' }}>
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

export function IYBudgetCard({ collaboratorId, compact = false }: Props) {
  const { montoTotal, montoGastado, montoDisponible, porcentajeUsado, isLoading } =
    useIYBudgetSummary(collaboratorId)

  if (isLoading) {
    if (compact) {
      return (
        <div className="animate-pulse h-6 bg-gray-100 rounded w-48" />
      )
    }
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded" />
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          IY:{' '}
          <span className="font-medium text-gray-900">{formatUSD(montoDisponible)}</span>{' '}
          disponible de{' '}
          <span className="font-medium">{formatUSD(montoTotal)}</span>
        </p>
        <ProgressBar pct={porcentajeUsado} />
      </div>
    )
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-indigo-800">Presupuesto IY (Improve Yourself)</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-base font-bold text-gray-900">{formatUSD(montoTotal)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
          <p className="text-xs text-gray-500 mb-1">Gastado</p>
          <p className="text-base font-bold text-gray-900">{formatUSD(montoGastado)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
          <p className="text-xs text-gray-500 mb-1">Disponible</p>
          <p
            className={`text-base font-bold ${
              montoDisponible < 0
                ? 'text-red-600'
                : montoDisponible === 0
                ? 'text-yellow-600'
                : 'text-green-600'
            }`}
          >
            {formatUSD(montoDisponible)}
          </p>
        </div>
      </div>
      <ProgressBar pct={porcentajeUsado} />
      <p className="text-xs text-gray-500 text-right">{Math.round(porcentajeUsado)}% utilizado</p>
    </div>
  )
}
