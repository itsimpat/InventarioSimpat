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
  useEquipment,
  useChangeEquipmentStatus,
  useAssignEquipment,
  useUnassignEquipment,
} from '../../hooks/useEquipment'
import { useCollaborator, useCollaborators } from '../../hooks/useCollaborators'
import { useAuth } from '../../contexts/AuthContext'
import { formatUSD, formatMXN } from '../../utils/currency'
import type { EquipmentStatus } from '../../types'

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Asignado',
  'En Bodega',
  'En Reparación',
  'Vendido',
  'Dado de Baja',
  'Solicitado',
]

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const { data: equipment, isLoading } = useEquipment(id ?? '')
  const { data: collaborator } = useCollaborator(equipment?.colaborador_id ?? '')
  const { data: collaborators = [] } = useCollaborators({ activo: true })

  const changeStatus = useChangeEquipmentStatus()
  const assignEquipment = useAssignEquipment()
  const unassignEquipment = useUnassignEquipment()

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus>('En Bodega')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCollaborator, setSelectedCollaborator] = useState('')
  const [showUnassignModal, setShowUnassignModal] = useState(false)
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

  if (!equipment) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-500">Equipo no encontrado.</div>
      </Layout>
    )
  }

  const specs = equipment.especificaciones as Record<string, string>

  async function handleChangeStatus() {
    if (!id) return
    try {
      await changeStatus.mutateAsync({ id, status: selectedStatus })
      toast('Estatus actualizado', 'success')
      setShowStatusModal(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al cambiar estatus', 'error')
    }
  }

  async function handleAssign() {
    if (!id || !selectedCollaborator) return
    try {
      await assignEquipment.mutateAsync({
        equipmentId: id,
        collaboratorId: selectedCollaborator,
        registradoPor,
      })
      toast('Equipo asignado correctamente', 'success')
      setShowAssignModal(false)
      setSelectedCollaborator('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al asignar equipo', 'error')
    }
  }

  async function handleUnassign() {
    if (!id) return
    try {
      await unassignEquipment.mutateAsync({ equipmentId: id, registradoPor })
      toast('Equipo desasignado correctamente', 'success')
      setShowUnassignModal(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al desasignar equipo', 'error')
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
              onClick={() => navigate('/equipos')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {equipment.marca} {equipment.modelo}
                </h1>
                <StatusBadge status={equipment.estatus} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/equipos/${id}/editar`)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => {
                setSelectedStatus(equipment.estatus)
                setShowStatusModal(true)
              }}
              className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Cambiar Estatus
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Información</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoItem label="Año de compra" value={String(equipment.anio_compra)} />
            <InfoItem label="Costo (MXN)" value={formatMXN(equipment.costo_mxn)} />
            <InfoItem label="Costo (USD)" value={formatUSD(equipment.costo_usd)} />
            {specs.cpu && <InfoItem label="CPU" value={specs.cpu} />}
            {specs.ram && <InfoItem label="RAM" value={specs.ram} />}
            {specs.almacenamiento && <InfoItem label="Almacenamiento" value={specs.almacenamiento} />}
            {specs.pantalla && <InfoItem label="Pantalla" value={specs.pantalla} />}
          </div>
        </div>

        {/* Collaborator section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Colaborador Asignado</h2>
          {collaborator ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{collaborator.nombre}</p>
                <p className="text-sm text-gray-500">{collaborator.area} — {collaborator.puesto}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCollaborator(equipment.colaborador_id ?? '')
                    setShowAssignModal(true)
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reasignar
                </button>
                <button
                  onClick={() => setShowUnassignModal(true)}
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Desasignar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-400 italic">Sin asignar</p>
              <button
                onClick={() => {
                  setSelectedCollaborator('')
                  setShowAssignModal(true)
                }}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Asignar
              </button>
            </div>
          )}
        </div>

        {/* History section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Historial</h2>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              + Registrar Evento
            </button>
          </div>
          <HistoryTimeline tipo="Equipment" entityId={id ?? ''} />
        </div>
      </div>

      {/* Change status modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Cambiar Estatus" size="sm">
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
        title={collaborator ? 'Reasignar Equipo' : 'Asignar Equipo'}
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
              disabled={assignEquipment.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={assignEquipment.isPending || !selectedCollaborator}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {assignEquipment.isPending ? 'Asignando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Unassign confirm modal */}
      <ConfirmModal
        isOpen={showUnassignModal}
        title="Desasignar Equipo"
        message={`¿Estás seguro de que quieres desasignar este equipo de ${collaborator?.nombre ?? 'el colaborador'}? El equipo pasará a En Bodega.`}
        confirmLabel="Desasignar"
        confirmVariant="danger"
        onConfirm={handleUnassign}
        onCancel={() => setShowUnassignModal(false)}
        isLoading={unassignEquipment.isPending}
      />

      {/* Event modal */}
      <EventFormModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        entityTipo="Equipment"
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
