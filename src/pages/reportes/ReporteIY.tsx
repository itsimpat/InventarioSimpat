import React, { Suspense } from 'react'
import { useIYReport } from '../../hooks/useReports'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatUSD } from '../../utils/currency'

// Safe import for IYBudgetCard from Agent 3
const IYBudgetCard = React.lazy(() =>
  import('../../components/shared/IYBudgetCard')
    .then((m) => ({ default: (m as unknown as { default: React.ComponentType<{ collaboratorId: string }> }).default }))
    .catch(() => ({
      default: (() => null) as React.ComponentType<{ collaboratorId: string }>,
    }))
)

function IYSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
      <table className="w-full">
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b border-gray-50">
              {[1, 2, 3, 4, 5].map((j) => (
                <td key={j} className="px-5 py-3">
                  <div className="h-3 bg-gray-100 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProgressBar({ percentage }: { percentage: number }) {
  const color =
    percentage >= 90
      ? 'bg-red-500'
      : percentage >= 70
      ? 'bg-yellow-500'
      : 'bg-green-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold w-10 text-right ${
          percentage >= 90
            ? 'text-red-600'
            : percentage >= 70
            ? 'text-yellow-600'
            : 'text-green-600'
        }`}
      >
        {percentage.toFixed(0)}%
      </span>
    </div>
  )
}

export function ReporteIY() {
  const { data: rows, isLoading, isError } = useIYReport()

  if (isLoading) return <IYSkeleton />

  if (isError) {
    return (
      <EmptyState title="No se pudo cargar el reporte IY" />
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title="Sin presupuestos IY configurados"
        description="Asigna un presupuesto Improve Yourself a los colaboradores para ver el reporte"
      />
    )
  }

  // Summary stats
  const totalBudget = rows.reduce((s, r) => s + r.montoTotal, 0)
  const totalSpent = rows.reduce((s, r) => s + r.montoGastado, 0)
  const totalAvailable = rows.reduce((s, r) => s + r.montoDisponible, 0)
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Presupuesto Total IY</p>
          <p className="text-2xl font-bold text-purple-600">{formatUSD(totalBudget)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{rows.length} colaboradores</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Gastado</p>
          <p className="text-2xl font-bold text-gray-800">{formatUSD(totalSpent)}</p>
          <ProgressBar percentage={overallPct} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Disponible</p>
          <p className="text-2xl font-bold text-green-600">{formatUSD(totalAvailable)}</p>
          <p className="text-xs text-gray-400 mt-0.5">sin asignar en licencias IY activas</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Detalle por colaborador</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Colaborador
                </th>
                <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                  Presupuesto
                </th>
                <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                  Gastado
                </th>
                <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                  Disponible
                </th>
                <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase min-w-[160px]">
                  % Uso
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.collaboratorId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{row.nombre}</td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {formatUSD(row.montoTotal)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-800">
                    {formatUSD(row.montoGastado)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${
                      row.montoDisponible <= 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatUSD(row.montoDisponible)}
                  </td>
                  <td className="px-5 py-3 min-w-[160px]">
                    <ProgressBar percentage={row.porcentajeUsado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IYBudgetCard compact per collaborator — Agent 3 */}
      <Suspense fallback={null}>
        {rows.slice(0, 3).map((row) => (
          <IYBudgetCard key={row.collaboratorId} collaboratorId={row.collaboratorId} />
        ))}
      </Suspense>
    </div>
  )
}
