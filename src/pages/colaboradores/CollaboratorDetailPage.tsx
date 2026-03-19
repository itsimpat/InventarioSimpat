import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { useToast } from '../../components/shared/Toast'
import { useCollaborator, useDeactivateCollaborator } from '../../hooks/useCollaborators'
import { useIYBudget, useUpsertIYBudget } from '../../hooks/useIYBudget'
import { formatDate } from '../../utils/dates'
import { formatMXN } from '../../utils/currency'

export function CollaboratorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: collaborator, isLoading, refetch } = useCollaborator(id ?? '')
  const { data: iyBudget } = useIYBudget(id ?? '')
  const deactivateMutation = useDeactivateCollaborator()
  const upsertBudget = useUpsertIYBudget()

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetValue, setBudgetValue] = useState('')

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48 text-gray-400">
          Cargando...
        </div>
      </Layout>
    )
  }

  if (!collaborator) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48 text-gray-400">
          Colaborador no encontrado
        </div>
      </Layout>
    )
  }

  async function handleDeactivate() {
    if (!collaborator) return
    // TODO: verificar licencias IY activas cuando exista licenseService
    try {
      await deactivateMutation.mutateAsync(collaborator.id)
      toast(`${collaborator.nombre} ha sido desactivado`, 'success')
      setShowDeactivateModal(false)
      void refetch()
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error al desactivar el colaborador',
        'error'
      )
    }
  }

  async function handleSaveBudget() {
    if (!collaborator) return
    const monto = parseFloat(budgetValue)
    if (isNaN(monto) || monto < 0) {
      toast('Monto inválido', 'error')
      return
    }
    try {
      await upsertBudget.mutateAsync({ collaboratorId: collaborator.id, montoTotal: monto })
      toast('Presupuesto IY actualizado', 'success')
      setEditingBudget(false)
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Error al actualizar el presupuesto',
        'error'
      )
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/colaboradores')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Volver"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">{collaborator.nombre}</h1>
                <StatusBadge status={collaborator.activo ? 'Asignado' : 'Dado de Baja'} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{collaborator.puesto}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/colaboradores/${collaborator.id}/editar`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
            {collaborator.activo && (
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Desactivar
              </button>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Información general</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Área</p>
              <p className="text-sm text-gray-800">{collaborator.area}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Puesto</p>
              <p className="text-sm text-gray-800">{collaborator.puesto}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm text-gray-800">{collaborator.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de ingreso</p>
              <p className="text-sm text-gray-800">{formatDate(collaborator.fecha_ingreso)}</p>
            </div>
          </div>
        </div>

        {/* IY Budget */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Presupuesto IY (Improve Yourself)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto total</p>
              {editingBudget ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveBudget}
                    disabled={upsertBudget.isPending}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingBudget(false)}
                    className="px-3 py-1 text-gray-500 text-xs hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-800">
                    {iyBudget ? formatMXN(iyBudget.monto_total) : '—'}
                  </p>
                  <button
                    onClick={() => {
                      setBudgetValue(iyBudget ? String(iyBudget.monto_total) : '')
                      setEditingBudget(true)
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto gastado</p>
              {/* TODO: calcular monto_gastado cuando exista licenseService (Agente 3) */}
              <p className="text-sm text-gray-400 italic">Disponible próximamente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        title="Desactivar colaborador"
        message={
          <span>
            ¿Desactivar a <strong>{collaborator.nombre}</strong>? Su historial se conservará.{' '}
            <span className="text-yellow-600">
              Nota: verificar licencias IY activas antes de continuar.
            </span>
          </span>
        }
        confirmLabel="Desactivar"
        confirmVariant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivateModal(false)}
        isLoading={deactivateMutation.isPending}
      />
    </Layout>
  )
}
