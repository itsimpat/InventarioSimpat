import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCollaborators } from '../../hooks/useCollaborators'
import { useAreaReport } from '../../hooks/useReports'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatUSD } from '../../utils/currency'

function ReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4" />
      <div className="h-24 bg-gray-200 rounded" />
      <div className="h-48 bg-gray-200 rounded" />
    </div>
  )
}

export function ReporteArea() {
  const [selectedArea, setSelectedArea] = useState('')
  const { data: collaborators, isLoading: collabLoading } = useCollaborators({ activo: true })
  const { data: report, isLoading: reportLoading } = useAreaReport(selectedArea)

  const areas = useMemo(() => {
    if (!collaborators) return []
    return Array.from(new Set(collaborators.map((c) => c.area))).sort()
  }, [collaborators])

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar área
        </label>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— Selecciona un área —</option>
          {collabLoading && <option disabled>Cargando...</option>}
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Report */}
      {selectedArea && (
        <>
          {reportLoading ? (
            <ReportSkeleton />
          ) : !report ? (
            <EmptyState title="No se pudo cargar el reporte" />
          ) : (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Colaboradores</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {report.colaboradores.length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Equipos</p>
                  <p className="text-2xl font-bold text-gray-800">{report.totalEquipos}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Periféricos</p>
                  <p className="text-2xl font-bold text-gray-800">{report.totalPerifericos}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Licencias</p>
                  <p className="text-2xl font-bold text-gray-800">{report.totalLicencias}</p>
                </div>
              </div>

              {/* Collaborators List */}
              {report.colaboradores.length === 0 ? (
                <EmptyState
                  title="Sin colaboradores en esta área"
                  description="No hay colaboradores activos en el área seleccionada"
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Colaboradores del área — {selectedArea}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {report.colaboradores.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.nombre}</p>
                          <p className="text-xs text-gray-400">{c.puesto}</p>
                        </div>
                        <Link
                          to={`/colaboradores/${c.id}`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Ver perfil
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-blue-600 rounded-xl p-5 text-white">
                <p className="text-sm font-medium text-blue-200 uppercase tracking-wide mb-1">
                  Inversión total del área {selectedArea}
                </p>
                <p className="text-4xl font-bold">{formatUSD(report.totalInversionUSD)}</p>
                <p className="text-sm text-blue-200 mt-1">
                  {report.totalEquipos} equipos · {report.totalPerifericos} periféricos · {report.totalLicencias} licencias activas
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
