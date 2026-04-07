import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { Modal } from '../../components/shared/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { useToast } from '../../components/shared/Toast'
import { useLicenses, useDeactivateLicense, useReassignLicense } from '../../hooks/useLicenses'
import { useCollaborators } from '../../hooks/useCollaborators'
import { formatUSD } from '../../utils/currency'
import { formatDate, daysUntil } from '../../utils/dates'
import type { License } from '../../types'

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export function LicenseProductDashboard() {
  const navigate = useNavigate()
  const { name } = useParams<{ name: string }>()
  const productName = decodeURIComponent(name ?? '')
  const { toast } = useToast()

  const { data: allLicenses = [], isLoading } = useLicenses()
  const { data: collaborators = [] } = useCollaborators()

  const deactivateMutation = useDeactivateLicense()
  const reassignMutation = useReassignLicense()

  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const [reassignLicense, setReassignLicense] = useState<License | null>(null)
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('')

  const licenses = allLicenses.filter((l) => l.nombre_producto === productName)
  const activeLicenses = licenses.filter((l) => l.activa)

  const collaboratorMap = Object.fromEntries(collaborators.map((c) => [c.id, c.nombre]))
  const activeCollaborators = collaborators.filter((c) => c.activo)

  const totalCostUSD = activeLicenses.reduce((sum, l) => sum + l.costo_usd, 0)
  const nextRenewal = activeLicenses.reduce<License | null>((earliest, l) => {
    if (!earliest || l.fecha_renovacion < earliest.fecha_renovacion) return l
    return earliest
  }, null)

  const urgentLicenses = activeLicenses.filter((l) => daysUntil(l.fecha_renovacion) <= 7)

  async function handleDeactivate() {
    if (!deactivateId) return
    try {
      await deactivateMutation.mutateAsync(deactivateId)
      toast('License deactivated successfully', 'success')
      setDeactivateId(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error deactivating license', 'error')
    }
  }

  async function handleReassign() {
    if (!reassignLicense || !selectedCollaboratorId) return
    try {
      await reassignMutation.mutateAsync({ licenseId: reassignLicense.id, newCollaboratorId: selectedCollaboratorId })
      toast('License reassigned successfully', 'success')
      setReassignLicense(null)
      setSelectedCollaboratorId('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error reassigning license', 'error')
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      </Layout>
    )
  }

  if (licenses.length === 0) {
    return (
      <Layout>
        <div className="space-y-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">← Back</button>
          <EmptyState title="No licenses found" description={`No licenses found for "${productName}"`} />
        </div>
      </Layout>
    )
  }

  const categoria = licenses[0].categoria

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-gray-900">{productName}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  categoria === 'IY' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {categoria}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/licenses/new?product=${encodeURIComponent(productName)}`)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add License
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="Active collaborators" value={activeLicenses.length} />
          <KPICard label="Total cost (USD)" value={formatUSD(totalCostUSD)} />
          <KPICard
            label="Next renewal"
            value={nextRenewal ? formatDate(nextRenewal.fecha_renovacion) : '—'}
            sub={nextRenewal ? collaboratorMap[nextRenewal.colaborador_id] : undefined}
          />
          <KPICard
            label="Status"
            value={`${activeLicenses.length} active`}
            sub={`${licenses.length - activeLicenses.length} inactive`}
          />
        </div>

        {/* Renewal alert banner */}
        {urgentLicenses.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-red-800 mb-2">
              ⚠ {urgentLicenses.length} license{urgentLicenses.length > 1 ? 's' : ''} expiring in ≤7 days
            </p>
            <ul className="space-y-1">
              {urgentLicenses.map((l) => (
                <li key={l.id} className="text-sm text-red-700">
                  {collaboratorMap[l.colaborador_id] ?? l.colaborador_id} — {formatDate(l.fecha_renovacion)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Collaborators table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Collaborators</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Collaborator', 'Type', 'Cost (USD)', 'Renewal', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {licenses.map((l) => {
                  const days = daysUntil(l.fecha_renovacion)
                  const urgent = days <= 7 && l.activa
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {collaboratorMap[l.colaborador_id] ?? l.colaborador_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{l.tipo}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatUSD(l.costo_usd)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={urgent ? 'font-semibold text-red-700' : 'text-gray-600'}>
                          {formatDate(l.fecha_renovacion)}
                          {urgent && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                              ≤7d
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            l.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {l.activa ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setReassignLicense(l); setSelectedCollaboratorId(l.colaborador_id) }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => navigate(`/licenses/${l.id}/edit`)}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Edit
                          </button>
                          {l.activa && (
                            <button
                              onClick={() => setDeactivateId(l.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deactivate modal */}
      <ConfirmModal
        isOpen={!!deactivateId}
        title="Deactivate license"
        message={`Are you sure you want to deactivate this license for "${productName}"?`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
        isLoading={deactivateMutation.isPending}
      />

      {/* Reassign modal */}
      <Modal
        isOpen={!!reassignLicense}
        onClose={() => setReassignLicense(null)}
        title="Reassign license"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">New collaborator</label>
            <select
              value={selectedCollaboratorId}
              onChange={(e) => setSelectedCollaboratorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a collaborator...</option>
              {activeCollaborators.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setReassignLicense(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={!selectedCollaboratorId || reassignMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {reassignMutation.isPending ? 'Reassigning...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
