import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { IYBudgetCard } from '../../components/shared/IYBudgetCard'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { Modal } from '../../components/shared/Modal'
import { useToast } from '../../components/shared/Toast'
import {
  useLicense,
  useDeactivateLicense,
  useReassignLicense,
} from '../../hooks/useLicenses'
import { useCollaborators } from '../../hooks/useCollaborators'
import { useCollaborator } from '../../hooks/useCollaborators'
import { formatUSD, formatMXN } from '../../utils/currency'
import { formatDate, daysUntil } from '../../utils/dates'

function RenewalBadge({ fecha }: { fecha: string }) {
  const days = daysUntil(fecha)
  const colorClass =
    days < 7
      ? 'bg-red-100 text-red-800'
      : days <= 30
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800'

  const label =
    days < 0
      ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
      : days === 0
      ? 'Expires today'
      : days === 1
      ? 'Expires in 1 day'
      : `Expires in ${days} days`

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  )
}

export function LicenseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const { data: license, isLoading } = useLicense(id ?? '')
  const { data: collaborator } = useCollaborator(license?.colaborador_id ?? '')
  const { data: allCollaborators = [] } = useCollaborators({ activo: true })

  const deactivateMutation = useDeactivateLicense()
  const reassignMutation = useReassignLicense()

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('')

  async function handleDeactivate() {
    if (!id) return
    try {
      await deactivateMutation.mutateAsync(id)
      toast('License deactivated successfully', 'success')
      setShowDeactivateModal(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error deactivating license', 'error')
    }
  }

  async function handleReassign() {
    if (!id || !selectedCollaboratorId) return
    try {
      await reassignMutation.mutateAsync({ licenseId: id, newCollaboratorId: selectedCollaboratorId })
      toast('License reassigned successfully', 'success')
      setShowReassignModal(false)
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

  if (!license) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-500">License not found.</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
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
              <h1 className="text-2xl font-semibold text-gray-900">{license.nombre_producto}</h1>
              <RenewalBadge fecha={license.fecha_renovacion} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  license.categoria === 'IY'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {license.categoria}
              </span>
              <span className="text-sm text-gray-500">{license.tipo}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  license.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {license.activa ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Detail card */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div className="grid grid-cols-2 gap-0">
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Collaborator</p>
              <p className="text-sm font-medium text-gray-900">
                {collaborator?.nombre ?? license.colaborador_id}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Renewal Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(license.fecha_renovacion)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-0">
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cost (MXN)</p>
              <p className="text-sm font-medium text-gray-900">{formatMXN(license.costo_mxn)}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cost (USD)</p>
              <p className="text-sm font-medium text-gray-900">{formatUSD(license.costo_usd)}</p>
            </div>
          </div>
        </div>

        {/* IY Budget card */}
        {license.categoria === 'IY' && license.colaborador_id && (
          <IYBudgetCard collaboratorId={license.colaborador_id} />
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/licencias/${id}/editar`)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Edit
          </button>
          {license.activa && (
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Deactivate
            </button>
          )}
          <button
            onClick={() => {
              setSelectedCollaboratorId(license.colaborador_id)
              setShowReassignModal(true)
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reassign
          </button>
        </div>
      </div>

      {/* Deactivate modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        title="Deactivate license"
        message={`Are you sure you want to deactivate the license "${license.nombre_producto}"? This action can be undone by editing the license.`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivateModal(false)}
        isLoading={deactivateMutation.isPending}
      />

      {/* Reassign modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign license"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              New collaborator
            </label>
            <select
              value={selectedCollaboratorId}
              onChange={(e) => setSelectedCollaboratorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a collaborator...</option>
              {allCollaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowReassignModal(false)}
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
