import React, { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/Layout'
import { EmptyState } from '../components/shared/EmptyState'
import { useDashboardKPIs, useRecentActivity } from '../hooks/useReports'
import { formatUSD } from '../utils/currency'
import { formatRelative, formatDate } from '../utils/dates'

// Safe import — Agente 3 may or may not have created this yet
const NotificationBanner = React.lazy(() =>
  import('../components/shared/NotificationBanner')
    .then((m) => ({ default: (m as unknown as { default: React.ComponentType }).default }))
    .catch(() => ({ default: (() => null) as unknown as React.ComponentType<Record<string, never>> }))
)

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-3 bg-gray-200 rounded animate-pulse mb-3 w-2/3" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  Reasignación: 'bg-blue-100 text-blue-700',
  Reparación: 'bg-yellow-100 text-yellow-700',
  Mantenimiento: 'bg-purple-100 text-purple-700',
  Otro: 'bg-gray-100 text-gray-700',
}

const ENTITY_TYPE_ROUTES: Record<string, string> = {
  Equipment: '/equipos',
  Peripheral: '/perifericos',
  OfficeItem: '/oficina',
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs()
  const { data: activity, isLoading: activityLoading } = useRecentActivity()

  return (
    <Layout>
      <div className="space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Bienvenido,{' '}
            <span className="text-indigo-600">
              {user?.profile?.name ?? user?.email}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Panel de control — Simpat Tech Inventario
          </p>
        </div>

        {/* Notification Banner (Agent 3) */}
        <Suspense fallback={null}>
          <NotificationBanner />
        </Suspense>

        {/* KPI Cards */}
        {kpisLoading ? (
          <KPISkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Total Equipos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Equipos
                </p>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-indigo-600">
                {kpis?.totalEquipos ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis?.totalEquiposActivos ?? 0} activos
              </p>
            </div>

            {/* Licencias Activas */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Licencias Activas
                </p>
                <div className="p-2 bg-green-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600"
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
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {kpis?.licenciasActivas ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">licencias vigentes</p>
            </div>

            {/* Alertas */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Alertas
                </p>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-yellow-600">0</p>
              <p className="text-xs text-gray-400 mt-1">vencimientos próximos</p>
            </div>

            {/* Inversion Total */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Inversión Total
                </p>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600 leading-tight">
                {formatUSD(kpis?.totalInversionUSD ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">activos totales USD</p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Actividad reciente</h2>
            <Link
              to="/reportes"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver reportes
            </Link>
          </div>

          {activityLoading ? (
            <ActivitySkeleton />
          ) : !activity || activity.length === 0 ? (
            <EmptyState
              title="Sin actividad reciente"
              description="Las acciones realizadas en el sistema aparecerán aquí"
            />
          ) : (
            <ul className="divide-y divide-gray-50">
              {activity.map(({ event, entityNombre }) => {
                const route = ENTITY_TYPE_ROUTES[event.entidad_tipo]
                const entityLink = route ? `${route}/${event.entidad_id}` : null

                return (
                  <li key={event.id} className="flex items-start gap-3 px-6 py-4">
                    <div className="mt-0.5 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          EVENT_TYPE_COLORS[event.tipo_evento] ?? EVENT_TYPE_COLORS['Otro']
                        }`}
                      >
                        {event.tipo_evento}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {entityLink ? (
                          <Link
                            to={entityLink}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {entityNombre}
                          </Link>
                        ) : (
                          <span className="font-medium">{entityNombre}</span>
                        )}
                        {event.descripcion ? (
                          <span className="text-gray-500"> — {event.descripcion}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatRelative(event.fecha_inicio)} · {formatDate(event.fecha_inicio)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  )
}
