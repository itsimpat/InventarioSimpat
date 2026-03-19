import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { EmptyState } from '../../components/shared/EmptyState'
import { useToast } from '../../components/shared/Toast'
import { useOfficeItem, useUpdateOfficeItemQuantity } from '../../hooks/useOfficeItems'
import { formatUSD, formatMXN } from '../../utils/currency'
import { formatDate } from '../../utils/dates'

// TODO: importar HistoryTimeline del Agente 2 cuando esté disponible
// TODO: importar EventFormModal del Agente 2 cuando esté disponible

export function OfficeDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const { data: item, isLoading } = useOfficeItem(id ?? '')
  const updateQuantityMutation = useUpdateOfficeItemQuantity()

  const [editingQty, setEditingQty] = useState(false)
  const [qtyInput, setQtyInput] = useState<number>(1)

  function startEditQty() {
    setQtyInput(item?.cantidad ?? 1)
    setEditingQty(true)
  }

  async function saveQty() {
    if (!id || qtyInput < 1) return
    try {
      await updateQuantityMutation.mutateAsync({ id, quantity: qtyInput })
      toast('Cantidad actualizada', 'success')
      setEditingQty(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al actualizar la cantidad', 'error')
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48 text-gray-400">Cargando...</div>
      </Layout>
    )
  }

  if (!item) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-500">Artículo no encontrado.</div>
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
            aria-label="Volver"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{item.nombre}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{item.categoria}</p>
          </div>
        </div>

        {/* Detail card */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div className="grid grid-cols-2">
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Marca</p>
              <p className="text-sm font-medium text-gray-900">{item.marca || '—'}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Categoría</p>
              <p className="text-sm font-medium text-gray-900">{item.categoria}</p>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Costo MXN</p>
              <p className="text-sm font-medium text-gray-900">{formatMXN(item.costo_mxn)}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Costo USD</p>
              <p className="text-sm font-medium text-gray-900">{formatUSD(item.costo_usd)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de compra</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(item.fecha_compra)}</p>
            </div>
            {/* Quantity inline edit */}
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cantidad</p>
              {editingQty ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={qtyInput}
                    onChange={(e) => setQtyInput(parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={saveQty}
                    disabled={updateQuantityMutation.isPending}
                    className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {updateQuantityMutation.isPending ? '...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingQty(false)}
                    className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.cantidad}</span>
                  <button
                    onClick={startEditQty}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline transition-colors"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance button */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              // TODO: Abrir EventFormModal del Agente 2 cuando esté disponible
              toast('Módulo de mantenimiento disponible próximamente', 'info')
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Registrar Mantenimiento
          </button>
        </div>

        {/* Maintenance history */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Historial de mantenimientos</h2>
          </div>
          {/* TODO: HistoryTimeline del Agente 2 cuando esté disponible */}
          <EmptyState
            title="Sin historial de mantenimientos"
            description="Los mantenimientos registrados para este artículo aparecerán aquí"
          />
        </div>
      </div>
    </Layout>
  )
}
