import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProductGroup } from '../../hooks/useLicenses'
import { formatUSD } from '../../utils/currency'
import { formatDate, daysUntil } from '../../utils/dates'

interface Props {
  group: ProductGroup
  collaboratorNames: Record<string, string>
}

export function ProductCard({ group, collaboratorNames }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nextDays = group.nextRenewal ? daysUntil(group.nextRenewal.date) : null
  const isUrgent = nextDays !== null && nextDays <= 7

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
      {/* Card header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-gray-900 leading-tight">
            {group.nombre_producto}
          </h3>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
              group.categoria === 'IY'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {group.categoria}
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Collaborators</p>
            <p className="text-lg font-bold text-gray-900">{group.activeCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total USD</p>
            <p className="text-lg font-bold text-gray-900">{formatUSD(group.totalCostUSD)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Next renewal</p>
            {group.nextRenewal ? (
              <p className={`text-sm font-medium ${isUrgent ? 'text-red-700' : 'text-gray-700'}`}>
                {formatDate(group.nextRenewal.date)}
                {isUrgent && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                    ≤7d
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>

        {/* Accordion toggle */}
        {group.activeCount > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <span>{open ? '▲' : '▼'}</span>
            <span>{open ? 'Hide' : 'Show'} collaborators</span>
          </button>
        )}

        {/* Accordion body */}
        {open && (
          <ul className="mt-3 divide-y divide-gray-50 border-t border-gray-100 pt-2">
            {group.licenses
              .filter((l) => l.activa)
              .map((l) => {
                const days = daysUntil(l.fecha_renovacion)
                const urgent = days <= 7
                return (
                  <li key={l.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-800 truncate">
                      {collaboratorNames[l.colaborador_id] ?? l.colaborador_id}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">{formatUSD(l.costo_usd)}</span>
                      <span className={`text-xs ${urgent ? 'text-red-700 font-semibold' : 'text-gray-400'}`}>
                        {formatDate(l.fecha_renovacion)}
                        {urgent && (
                          <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                            ≤7d
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <button
          onClick={() => navigate(`/licenses/product/${encodeURIComponent(group.nombre_producto)}`)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View dashboard →
        </button>
      </div>
    </div>
  )
}
