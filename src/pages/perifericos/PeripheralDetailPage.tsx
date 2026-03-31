import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { Modal } from '../../components/shared/Modal'
import { HistoryTimeline } from '../../components/shared/HistoryTimeline'
import { EventFormModal } from '../../components/shared/EventFormModal'
import { useToast } from '../../components/shared/Toast'
import {
  usePeripheral,
  useChangePeripheralStatus,
  useAssignPeripheral,
  useReturnToBodega,
} from '../../hooks/usePeripherals'
import { useCollaborator, useCollaborators } from '../../hooks/useCollaborators'
import { useAuth } from '../../contexts/AuthContext'
import { formatUSD, formatMXN } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import type { EquipmentStatus } from '../../types'

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Asignado',
  'En Bodega',
  'En Reparación',
  'Vendido',
  'Dado de Baja',
  'Solicitado',
]

export function PeripheralDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const { data: peripheral, isLoading } = usePeripheral(id ?? '')
  const { data: collaborator } = useCollaborator(peripheral?.colaborador_id ?? '')
  const { data: collaborators = [] } = useCollaborators({ activo: true })

  const changeStatus = useChangePeripheralStatus()
  const assignPeripheral = useAssignPeripheral()
  const returnToBodega = useReturnToBodega()

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus>('En Bodega')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCollaborator, setSelectedCollaborator] = useState('')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

  const registradoPor = user?.email ?? 'Sistema'

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    )
  }

  if (!peripheral) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-500">Peripheral not found.</div>
      </Layout>
    )
  }

  const ownership = peripheral.colaborador_id ? 'Colaborador' : 'Bodega'

  async function handleChangeStatus() {
    if (!id) return
    try {
      await changeStatus.mutateAsync({ id, status: selectedStatus })
      toast('Status updated', 'success')
      setShowStatusModal(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error changing status', 'error')
    }
  }

  async function handleAssign() {
    if (!id || !selectedCollaborator) return
    try {
      await assignPeripheral.mutateAsync({
        peripheralId: id,
        collaboratorId: selectedCollaborator,
        registradoPor,
      })
      toast('Peripheral assigned successfully', 'success')
      setShowAssignModal(false)
      setSelectedCollaborator('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error assigning peripheral', 'error')
    }
  }

  async function handleReturnToBodega() {
    if (!id) return
    try {
      await returnToBodega.mutateAsync({ peripheralId: id, registradoPor })
      toast('Peripheral returned to storage', 'success')
      setShowReturnModal(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error returning to storage', 'error')
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/perifericos')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {peripheral.tipo} — {peripheral.marca} {peripheral.modelo}
                </h1>
                <StatusBadge status={peripheral.estatus} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/perifericos/${id}/editar`)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setSelectedStatus(peripheral.estatus)
                setShowStatusModal(true)
              }}
              className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Change Status
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoItem label="Type" value={peripheral.tipo} />
            <InfoItem label="Brand" value={peripheral.marca} />
            <InfoItem label="Model" value={peripheral.modelo} />
            <InfoItem label="Purchase date" value={formatDate(peripheral.fecha_compra)} />
            <InfoItem label="Cost (MXN)" value={formatMXN(peripheral.costo_mxn)} />
            <InfoItem label="Cost (USD)" value={formatUSD(peripheral.costo_usd)} />
            <InfoItem label="Ownership" value={ownership} />
          </div>
        </div>

        {/* Ownership / assignment section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Assignment</h2>
          {peripheral.colaborador_id && collaborator ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{collaborator.nombre}</p>
                <p className="text-sm text-gray-500">{collaborator.area} — {collaborator.puesto}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCollaborator(peripheral.colaborador_id ?? '')
                    setShowAssignModal(true)
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reassign
                </button>
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Return to Storage
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-400 italic">In Storage — no collaborator assigned</p>
              <button
                onClick={() => {
                  setSelectedCollaborator('')
                  setShowAssignModal(true)
                }}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Assign to Collaborator
              </button>
            </div>
          )}
        </div>

        {/* History section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">History</h2>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              + Log Event
            </button>
          </div>
          <HistoryTimeline tipo="Peripheral" entityId={id ?? ''} />
        </div>
      </div>

      {/* Change status modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Change Status" size="sm">
        <div className="space-y-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as EquipmentStatus)}
            className={inputClass}
          >
            {EQUIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowStatusModal(false)}
              disabled={changeStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangeStatus}
              disabled={changeStatus.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {changeStatus.isPending ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={peripheral.colaborador_id ? 'Reasignar Periférico' : 'Asignar a Colaborador'}
        size="sm"
      >
        <div className="space-y-4">
          <select
            value={selectedCollaborator}
            onChange={(e) => setSelectedCollaborator(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecciona un colaborador...</option>
            {collaborators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.area}
              </option>
            ))}
          </select>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowAssignModal(false)}
              disabled={assignPeripheral.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={assignPeripheral.isPending || !selectedCollaborator}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {assignPeripheral.isPending ? 'Asignando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Return to bodega confirm modal */}
      <ConfirmModal
        isOpen={showReturnModal}
        title="Regresar a Bodega"
        message={`¿Estás seguro de que quieres regresar este periférico de ${collaborator?.nombre ?? 'el colaborador'} a la bodega?`}
        confirmLabel="Regresar a Bodega"
        confirmVariant="danger"
        onConfirm={handleReturnToBodega}
        onCancel={() => setShowReturnModal(false)}
        isLoading={returnToBodega.isPending}
      />

      {/* Event modal */}
      <EventFormModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        entityTipo="Peripheral"
        entityId={id ?? ''}
        registradoPor={registradoPor}
      />
    </Layout>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
