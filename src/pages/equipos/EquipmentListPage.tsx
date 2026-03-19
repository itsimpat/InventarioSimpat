import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Table, type Column } from '../../components/shared/Table'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { useEquipmentList } from '../../hooks/useEquipment'
import { formatUSD } from '../../utils/currency'
import type { Equipment, EquipmentStatus } from '../../types'

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Asignado',
  'En Bodega',
  'En Reparación',
  'Vendido',
  'Dado de Baja',
  'Solicitado',
]

const columns: Column<Equipment>[] = [
  {
    key: 'marca',
    header: 'Marca',
    sortable: true,
  },
  {
    key: 'modelo',
    header: 'Modelo',
    sortable: true,
  },
  {
    key: 'estatus',
    header: 'Estatus',
    render: (row) => <StatusBadge status={row.estatus} />,
  },
  {
    key: 'colaborador_id',
    header: 'Colaborador',
    render: (row) =>
      row.colaborador_id ? (
        <span className="text-gray-700">{row.colaborador_id}</span>
      ) : (
        <span className="text-gray-400 italic">Sin asignar</span>
      ),
  },
  {
    key: 'costo_usd',
    header: 'Costo (USD)',
    sortable: true,
    render: (row) => <span className="font-medium">{formatUSD(row.costo_usd)}</span>,
  },
  {
    key: 'anio_compra',
    header: 'Año compra',
    sortable: true,
  },
]

export function EquipmentListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | ''>('')
  const [search, setSearch] = useState('')

  const { data: equipment = [], isLoading } = useEquipmentList({
    status: statusFilter || undefined,
    brand: search || undefined,
  })

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {equipment.length} equipo{equipment.length !== 1 ? 's' : ''} registrado
              {equipment.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/equipos/nuevo')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Nuevo Equipo
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todos los estatus</option>
            {EQUIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca o modelo..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={equipment}
          isLoading={isLoading}
          emptyMessage="No hay equipos registrados"
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/equipos/${row.id}`)}
        />
      </div>
    </Layout>
  )
}
