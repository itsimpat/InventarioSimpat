import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { useToast } from '../../components/shared/Toast'
import { useCollaborator, useDeactivateCollaborator } from '../../hooks/useCollaborators'
import { useIYBudget, useUpsertIYBudget } from '../../hooks/useIYBudget'
import { useEquipmentList } from '../../hooks/useEquipment'
import { usePeripheralList } from '../../hooks/usePeripherals'
import { useLicenses } from '../../hooks/useLicenses'
import { formatDate } from '../../utils/dates'
import { formatMXN, formatUSD } from '../../utils/currency'
import type { Equipment, Peripheral, License } from '../../types'

export function CollaboratorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: collaborator, isLoading, refetch } = useCollaborator(id ?? '')
  const { data: iyBudget } = useIYBudget(id ?? '')
  const deactivateMutation = useDeactivateCollaborator()
  const upsertBudget = useUpsertIYBudget()

  const { data: equipment = [] } = useEquipmentList({ collaboratorId: id })
  const { data: peripherals = [] } = usePeripheralList({ collaboratorId: id })
  const { data: licenses = [] } = useLicenses({ collaboratorId: id })

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

  const activeLicenses = licenses.filter((l) => l.activa)
  const inactiveLicenses = licenses.filter((l) => !l.activa)

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
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Licencias IY activas</p>
              <p className="text-sm text-gray-800">
                {licenses.filter((l) => l.categoria === 'IY' && l.activa).length} licencia(s)
              </p>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <AssignedSection
          title="Equipos asignados"
          count={equipment.length}
          emptyText="Sin equipos asignados"
          addLink="/equipos/nuevo"
        >
          {equipment.map((e) => (
            <EquipmentCard key={e.id} equipment={e} />
          ))}
        </AssignedSection>

        {/* Peripherals */}
        <AssignedSection
          title="Periféricos asignados"
          count={peripherals.length}
          emptyText="Sin periféricos asignados"
          addLink="/perifericos/nuevo"
        >
          {peripherals.map((p) => (
            <PeripheralCard key={p.id} peripheral={p} />
          ))}
        </AssignedSection>

        {/* Licenses */}
        <AssignedSection
          title="Licencias"
          count={licenses.length}
          emptyText="Sin licencias asignadas"
          addLink="/licencias/nueva"
        >
          {activeLicenses.map((l) => (
            <LicenseCard key={l.id} license={l} />
          ))}
          {inactiveLicenses.length > 0 && activeLicenses.length > 0 && (
            <div className="col-span-full border-t border-gray-100 pt-2 mt-1">
              <p className="text-xs text-gray-400 mb-2">Inactivas</p>
            </div>
          )}
          {inactiveLicenses.map((l) => (
            <LicenseCard key={l.id} license={l} />
          ))}
        </AssignedSection>
      </div>

      {/* Deactivate modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        title="Desactivar colaborador"
        message={
          <span>
            ¿Desactivar a <strong>{collaborator.nombre}</strong>? Su historial se conservará.{' '}
            {licenses.some((l) => l.categoria === 'IY' && l.activa) && (
              <span className="text-yellow-600">
                Tiene licencias IY activas — recuerda reasignarlas o desactivarlas.
              </span>
            )}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssignedSection({
  title,
  count,
  emptyText,
  addLink,
  children,
}: {
  title: string
  count: number
  emptyText: string
  addLink: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          {title}
          {count > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </h2>
        <Link
          to={addLink}
          className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          + Agregar
        </Link>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-400 italic">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

function EquipmentCard({ equipment: e }: { equipment: Equipment }) {
  const specs = e.especificaciones as Record<string, string>
  return (
    <Link
      to={`/equipos/${e.id}`}
      className="block border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {e.marca} {e.modelo}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Compra {e.anio_compra}</p>
        </div>
        <StatusBadge status={e.estatus} />
      </div>
      {(specs.cpu || specs.ram) && (
        <p className="text-xs text-gray-400 mt-2 truncate">
          {[specs.cpu, specs.ram].filter(Boolean).join(' · ')}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-1">{formatUSD(e.costo_usd)} USD</p>
    </Link>
  )
}

function PeripheralCard({ peripheral: p }: { peripheral: Peripheral }) {
  return (
    <Link
      to={`/perifericos/${p.id}`}
      className="block border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {p.marca} {p.modelo}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{p.tipo}</p>
        </div>
        <StatusBadge status={p.estatus} />
      </div>
      <p className="text-xs text-gray-400 mt-2">{formatUSD(p.costo_usd)} USD</p>
    </Link>
  )
}

function LicenseCard({ license: l }: { license: License }) {
  const isExpiringSoon =
    l.activa &&
    new Date(l.fecha_renovacion).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000

  return (
    <Link
      to={`/licencias/${l.id}`}
      className={`block border rounded-lg p-4 hover:bg-indigo-50/30 transition-colors ${
        l.activa ? 'border-gray-200 hover:border-indigo-300' : 'border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{l.nombre_producto}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {l.tipo} · {l.categoria}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
            l.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {l.activa ? 'Activa' : 'Inactiva'}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">{formatUSD(l.costo_usd)} USD</p>
        <p className={`text-xs ${isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
          Renueva {formatDate(l.fecha_renovacion)}
        </p>
      </div>
    </Link>
  )
}
