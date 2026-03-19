import { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { daysUntil, formatDate } from '../../utils/dates'

export function NotificationBanner() {
  const { expiringSoon, daysAhead, hasAlerts, isLoading } = useNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (isLoading || !hasAlerts || dismissed) return null

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 font-semibold text-sm">
            ⚠️ {expiringSoon.length} licencia{expiringSoon.length !== 1 ? 's' : ''} próxima{expiringSoon.length !== 1 ? 's' : ''} a vencer en los próximos {daysAhead} días
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-yellow-700 underline hover:text-yellow-900 transition-colors"
          >
            {expanded ? 'Ocultar' : 'Ver detalle'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar alerta"
            className="text-yellow-500 hover:text-yellow-700 transition-colors leading-none ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded list */}
      {expanded && (
        <ul className="space-y-2 pt-1 border-t border-yellow-200">
          {expiringSoon.map((license) => {
            const days = daysUntil(license.fecha_renovacion)
            return (
              <li
                key={license.id}
                className="flex items-center justify-between text-sm text-yellow-900"
              >
                <span className="font-medium">{license.nombre_producto}</span>
                <span className="text-yellow-700 text-xs">
                  Vence: {formatDate(license.fecha_renovacion)}{' '}
                  <span className="font-semibold">
                    ({days === 0 ? 'hoy' : days === 1 ? 'en 1 día' : `en ${days} días`})
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
