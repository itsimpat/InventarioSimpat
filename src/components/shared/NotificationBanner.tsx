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
            ⚠️ {expiringSoon.length} license{expiringSoon.length !== 1 ? 's' : ''} expiring in the next {daysAhead} day{daysAhead !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-yellow-700 underline hover:text-yellow-900 transition-colors"
          >
            {expanded ? 'Hide' : 'View details'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss alert"
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
                  Expires: {formatDate(license.fecha_renovacion)}{' '}
                  <span className="font-semibold">
                    ({days === 0 ? 'today' : days === 1 ? 'in 1 day' : `in ${days} days`})
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
