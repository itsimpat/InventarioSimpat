import React, { Suspense, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { insforge } from '../../lib/insforge'
import { Layout } from '../../components/Layout'
import { EmptyState } from '../../components/shared/EmptyState'
import { useToast } from '../../components/shared/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { formatDate } from '../../utils/dates'
import type { EntityType, HistoryEvent } from '../../types'

// Safe lazy imports from Agent 2
const HistoryTimeline = React.lazy(() =>
  import('../../components/shared/HistoryTimeline')
    .then((m) => ({ default: m.HistoryTimeline }))
    .catch(() => ({
      default: ({ tipo: _tipo, entityId: _entityId }: { tipo: EntityType; entityId: string }) => (
        <div className="text-gray-500 p-4">Historial no disponible aún.</div>
      ),
    }))
)

const EventFormModal = React.lazy(
  () =>
    (import('../../components/shared/EventFormModal')
      .then((m) => ({ default: m.EventFormModal }))
      .catch(() => ({ default: (() => null) }))) as Promise<{ default: React.ComponentType<Record<string, unknown>> }>
)

type EntityKind = 'equipment' | 'peripheral' | 'office'

const KIND_TO_TABLE: Record<EntityKind, string> = {
  equipment: 'equipment',
  peripheral: 'peripherals',
  office: 'office_items',
}

const KIND_TO_ENTITY_TYPE: Record<EntityKind, EntityType> = {
  equipment: 'Equipment',
  peripheral: 'Peripheral',
  office: 'OfficeItem',
}

const KIND_TO_LABEL: Record<EntityKind, string> = {
  equipment: 'Equipment',
  peripheral: 'Peripherals',
  office: 'Office Inventory',
}

const KIND_TO_ROUTE: Record<EntityKind, string> = {
  equipment: '/equipos',
  peripheral: '/perifericos',
  office: '/oficina',
}

function getEntityNombre(entity: Record<string, unknown>, kind: EntityKind): string {
  if (kind === 'office') {
    return (entity.nombre as string) ?? 'Item'
  }
  return `${entity.marca ?? ''} ${entity.modelo ?? ''}`.trim() || 'Item'
}

function ClosingRepairForm({
  repairEvent,
  entityId,
  entityTipo,
}: {
  repairEvent: HistoryEvent
  entityId: string
  entityTipo: EntityType
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [fechaFin, setFechaFin] = useState('')
  const [notas, setNotas] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await insforge.database
        .from('history_events')
        .update({ fecha_fin: fechaFin, descripcion: notas || repairEvent.descripcion })
        .eq('id', repairEvent.id)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast('Repair closed successfully', 'success')
      void queryClient.invalidateQueries({ queryKey: ['historyEvents', entityTipo, entityId] })
    },
    onError: (err: Error) => {
      toast(err.message, 'error')
    },
  })

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-yellow-100 rounded-lg shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-yellow-800">Repair in progress</h3>
          <p className="text-sm text-yellow-700 mt-0.5">
            Start: {formatDate(repairEvent.fecha_inicio)}
            {repairEvent.tecnico_nombre ? ` · Technician: ${repairEvent.tecnico_nombre}` : ''}
          </p>
          {repairEvent.descripcion && (
            <p className="text-sm text-yellow-700">{repairEvent.descripcion}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Closing date
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Closing notes (optional)
          </label>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="E.g.: Screen replacement completed"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={() => mutation.mutate()}
          disabled={!fechaFin || mutation.isPending}
          className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending ? 'Saving...' : 'Mark as closed'}
        </button>
      </div>
    </div>
  )
}

export function HistorialPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)

  const kind = (tipo as EntityKind) ?? 'equipment'
  const entityId = id ?? ''
  const table = KIND_TO_TABLE[kind] ?? 'equipment'
  const entityTipo = KIND_TO_ENTITY_TYPE[kind] ?? 'Equipment'
  const kindLabel = KIND_TO_LABEL[kind] ?? 'Elementos'
  const kindRoute = KIND_TO_ROUTE[kind] ?? '/'

  // Fetch the entity name
  const { data: entity, isLoading: entityLoading } = useQuery({
    queryKey: ['entity-name', kind, entityId],
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from(table)
        .select()
        .eq('id', entityId)
        .single()
      if (error) throw new Error(error.message)
      return data as Record<string, unknown>
    },
    enabled: !!entityId,
  })

  // Fetch all events to find open repairs
  const { data: events } = useQuery({
    queryKey: ['historyEvents', entityTipo, entityId],
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from('history_events')
        .select()
        .eq('entidad_tipo', entityTipo)
        .eq('entidad_id', entityId)
        .order('fecha_inicio', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as HistoryEvent[]
    },
    enabled: !!entityId,
  })

  const openRepair = events?.find(
    (e) => e.tipo_evento === 'Repair' && e.fecha_fin === null
  ) ?? null

  const entityNombre =
    entity && !entityLoading ? getEntityNombre(entity, kind) : entityId

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to={kindRoute} className="hover:text-indigo-600 transition-colors">
            {kindLabel}
          </Link>
          <span>/</span>
          <Link
            to={`${kindRoute}/${entityId}`}
            className="hover:text-indigo-600 transition-colors truncate max-w-xs"
          >
            {entityNombre}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">History</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              History of{' '}
              <span className="text-indigo-600">
                {entityLoading ? '...' : entityNombre}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              All events recorded for this item
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log Event
          </button>
        </div>

        {/* Open repair banner */}
        {openRepair && (
          <ClosingRepairForm
            repairEvent={openRepair}
            entityId={entityId}
            entityTipo={entityTipo}
          />
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Events</h2>
          {!entityId ? (
            <EmptyState title="Invalid entity ID" />
          ) : (
            <Suspense
              fallback={
                <div className="text-gray-400 text-sm p-4 animate-pulse">
                  Loading history...
                </div>
              }
            >
              <HistoryTimeline tipo={entityTipo} entityId={entityId} />
            </Suspense>
          )}
        </div>
      </div>

      {/* Event Form Modal */}
      <Suspense fallback={null}>
        {showModal && (
          <EventFormModal
            isOpen={showModal}
            entityTipo={entityTipo}
            entityId={entityId}
            registradoPor={user?.email ?? 'admin'}
            onClose={() => setShowModal(false)}
          />
        )}
      </Suspense>
    </Layout>
  )
}
