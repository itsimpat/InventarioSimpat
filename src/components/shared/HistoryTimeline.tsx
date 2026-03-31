import { useHistoryEvents } from '../../hooks/useHistoryEvents'
import { useCollaborator } from '../../hooks/useCollaborators'
import type { EntityType, HistoryEvent } from '../../types'
import { formatDate } from '../../utils/dates'
import { formatMXN } from '../../utils/currency'
import { SkeletonRow } from './SkeletonRow'
import { EmptyState } from './EmptyState'

type Props = {
  tipo: EntityType
  entityId: string
}

function EventIcon({ tipo }: { tipo: HistoryEvent['tipo_evento'] }) {
  if (tipo === 'Reassignment') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    )
  }
  if (tipo === 'Repair') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  if (tipo === 'Maintenance') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
        />
      </svg>
    )
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function CollaboratorName({ id }: { id: string | null }) {
  const { data } = useCollaborator(id ?? '')
  if (!id) return <span className="text-gray-400 italic">Storage</span>
  return <span>{data?.nombre ?? id}</span>
}

function EventCard({ event }: { event: HistoryEvent }) {
  const isOngoing = event.tipo_evento === 'Repair' && event.fecha_fin === null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{event.tipo_evento}</span>
          {isOngoing && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              In Progress
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">{formatDate(event.fecha_inicio)}</span>
      </div>

      <p className="text-sm text-gray-600 mb-2">{event.descripcion}</p>

      {event.tipo_evento === 'Reassignment' && (
        <div className="text-sm text-gray-600 flex items-center gap-1 flex-wrap">
          <span className="font-medium">From:</span>
          <CollaboratorName id={event.colaborador_anterior_id} />
          <span className="text-gray-400">→</span>
          <span className="font-medium">To:</span>
          <CollaboratorName id={event.colaborador_nuevo_id} />
        </div>
      )}

      {(event.tipo_evento === 'Repair' || event.tipo_evento === 'Maintenance') && (
        <div className="mt-2 space-y-1">
          {event.tecnico_nombre && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Technician:</span> {event.tecnico_nombre}
              {event.tecnico_telefono && (
                <span className="ml-2 text-gray-400">({event.tecnico_telefono})</span>
              )}
            </div>
          )}
          {event.fecha_fin && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Completed:</span> {formatDate(event.fecha_fin)}
            </div>
          )}
          {event.costo_mxn !== null && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Cost:</span> {formatMXN(event.costo_mxn)}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">Logged by: {event.registrado_por}</p>
    </div>
  )
}

export function HistoryTimeline({ tipo, entityId }: Props) {
  const { data: events, isLoading } = useHistoryEvents(tipo, entityId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <table className="w-full">
          <tbody>
            <SkeletonRow cols={1} rows={3} />
          </tbody>
        </table>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <EmptyState
        title="No history"
        description="No events have been recorded for this item."
      />
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" aria-hidden />
      <div className="space-y-4 pl-10">
        {events.map((event) => (
          <div key={event.id} className="relative">
            <div className="absolute -left-6 top-4 w-8 h-8 rounded-full bg-white border-2 border-indigo-400 flex items-center justify-center text-indigo-600">
              <EventIcon tipo={event.tipo_evento} />
            </div>
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  )
}
