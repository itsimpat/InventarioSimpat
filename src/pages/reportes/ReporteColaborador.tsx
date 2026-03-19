import React, { Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollaborators } from '../../hooks/useCollaborators'
import { useCollaboratorReport } from '../../hooks/useReports'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatUSD } from '../../utils/currency'

// Safe import for IYBudgetCard from Agent 3
const IYBudgetCard = React.lazy(() =>
  import('../../components/shared/IYBudgetCard')
    .then((m) => ({ default: (m as unknown as { default: React.ComponentType<{ collaboratorId: string }> }).default }))
    .catch(() => ({
      default: (() => (
        <div className="text-gray-400 text-sm p-3 border border-dashed border-gray-200 rounded-lg">
          IY Budget no disponible
        </div>
      )) as React.ComponentType<{ collaboratorId: string }>,
    }))
)

function ReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  )
}

function TableSection({
  title,
  empty,
  children,
}: {
  title: string
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {empty ? (
        <p className="text-sm text-gray-400 italic px-5 py-4">Sin registros</p>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  )
}

export function ReporteColaborador() {
  const [selectedId, setSelectedId] = useState('')
  const { data: collaborators, isLoading: collabLoading } = useCollaborators({ activo: true })
  const { data: report, isLoading: reportLoading } = useCollaboratorReport(selectedId)

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar colaborador
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— Selecciona un colaborador —</option>
          {collabLoading && <option disabled>Cargando...</option>}
          {(collaborators ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} — {c.area}
            </option>
          ))}
        </select>
      </div>

      {/* Report */}
      {selectedId && (
        <>
          {reportLoading ? (
            <ReportSkeleton />
          ) : !report ? (
            <EmptyState title="No se pudo cargar el reporte" />
          ) : (
            <div className="space-y-5">
              {/* Collaborator Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {report.colaborador.nombre}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {report.colaborador.puesto} · {report.colaborador.area}
                    </p>
                    <p className="text-sm text-gray-400">{report.colaborador.email}</p>
                  </div>
                  <Link
                    to={`/colaboradores/${report.colaborador.id}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>

              {/* Equipos */}
              <TableSection
                title={`Equipos asignados (${report.equipos.length})`}
                empty={report.equipos.length === 0}
              >
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Marca</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Modelo</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Estatus</th>
                      <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.equipos.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">{e.marca}</td>
                        <td className="px-5 py-3 text-gray-600">{e.modelo}</td>
                        <td className="px-5 py-3 text-gray-500">{e.estatus}</td>
                        <td className="px-5 py-3 text-right text-gray-800">{formatUSD(e.costo_usd)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-5 py-3 text-gray-700">Subtotal equipos</td>
                      <td className="px-5 py-3 text-right text-gray-900">
                        {formatUSD(report.equipos.reduce((s, e) => s + e.costo_usd, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </TableSection>

              {/* Periféricos */}
              <TableSection
                title={`Periféricos (${report.perifericos.length})`}
                empty={report.perifericos.length === 0}
              >
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Marca</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Modelo</th>
                      <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.perifericos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500">{p.tipo}</td>
                        <td className="px-5 py-3 font-medium text-gray-800">{p.marca}</td>
                        <td className="px-5 py-3 text-gray-600">{p.modelo}</td>
                        <td className="px-5 py-3 text-right text-gray-800">{formatUSD(p.costo_usd)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-5 py-3 text-gray-700">Subtotal periféricos</td>
                      <td className="px-5 py-3 text-right text-gray-900">
                        {formatUSD(report.perifericos.reduce((s, p) => s + p.costo_usd, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </TableSection>

              {/* Licencias */}
              <TableSection
                title={`Licencias activas (${report.licencias.length})`}
                empty={report.licencias.length === 0}
              >
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                      <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                      <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.licencias.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">{l.nombre_producto}</td>
                        <td className="px-5 py-3 text-gray-500">{l.tipo}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              l.categoria === 'IY'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {l.categoria}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-800">{formatUSD(l.costo_usd)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-5 py-3 text-gray-700">Subtotal licencias</td>
                      <td className="px-5 py-3 text-right text-gray-900">
                        {formatUSD(report.licencias.reduce((s, l) => s + l.costo_usd, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </TableSection>

              {/* IY Budget Card */}
              {report.iyBudget && (
                <Suspense fallback={null}>
                  <IYBudgetCard collaboratorId={selectedId} />
                </Suspense>
              )}

              {/* Total */}
              <div className="bg-indigo-600 rounded-xl p-5 text-white">
                <p className="text-sm font-medium text-indigo-200 uppercase tracking-wide mb-1">
                  Inversión total en este colaborador
                </p>
                <p className="text-4xl font-bold">{formatUSD(report.totalInversionUSD)}</p>
              </div>

              {report.equipos.length === 0 &&
                report.perifericos.length === 0 &&
                report.licencias.length === 0 && (
                  <EmptyState
                    title="Sin activos asignados"
                    description="Este colaborador no tiene equipos, periféricos ni licencias asignados"
                  />
                )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
