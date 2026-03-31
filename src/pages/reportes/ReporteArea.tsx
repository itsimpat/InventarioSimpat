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
          Select area
        </label>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">— Select an area —</option>
          {collabLoading && <option disabled>Loading...</option>}
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
            <EmptyState title="Could not load the report" />
          ) : (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Collaborators</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {report.colaboradores.length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Equipment</p>
                  <p className="text-2xl font-bold text-gray-800">{report.totalEquipos}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Peripherals</p>
                  <p className="text-2xl font-bold text-gray-800">{report.totalPerifericos}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Licenses</p>
                  <p className="text-2xl font-bold text-gray-800">{report.totalLicencias}</p>
                </div>
              </div>

              {/* Collaborators List */}
              {report.colaboradores.length === 0 ? (
                <EmptyState
                  title="No collaborators in this area"
                  description="There are no active collaborators in the selected area"
                />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Collaborators in area — {selectedArea}
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
                          View profile
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-blue-600 rounded-xl p-5 text-white">
                <p className="text-sm font-medium text-blue-200 uppercase tracking-wide mb-1">
                  Total investment for area {selectedArea}
                </p>
                <p className="text-4xl font-bold">{formatUSD(report.totalInversionUSD)}</p>
                <p className="text-sm text-blue-200 mt-1">
                  {report.totalEquipos} equipment · {report.totalPerifericos} peripherals · {report.totalLicencias} active licenses
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
