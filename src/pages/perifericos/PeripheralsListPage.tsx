import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Table, type Column } from '../../components/shared/Table'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { usePeripheralList } from '../../hooks/usePeripherals'
import { formatUSD } from '../../utils/currency'
import type { Peripheral, PeripheralType, EquipmentStatus } from '../../types'

const PERIPHERAL_TYPES: PeripheralType[] = ['Monitor', 'Teclado', 'Audífonos', 'Mouse', 'Otro']

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Asignado',
  'En Bodega',
  'En Reparación',
  'Vendido',
  'Dado de Baja',
  'Solicitado',
]

const columns: Column<Peripheral>[] = [
  { key: 'tipo', header: 'Tipo', sortable: true },
  { key: 'marca', header: 'Marca', sortable: true },
  { key: 'modelo', header: 'Modelo', sortable: true },
  {
    key: 'estatus',
    header: 'Estatus',
    render: (row) => <StatusBadge status={row.estatus} />,
  },
  {
    key: 'colaborador_id',
    header: 'Ownership',
    render: (row) =>
      row.colaborador_id ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Colaborador
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Bodega
        </span>
      ),
  },
  {
    key: 'colaborador_id_name',
    header: 'Colaborador',
    render: (row) =>
      row.colaborador_id ? (
        <span className="text-gray-700">{row.colaborador_id}</span>
      ) : (
        <span className="text-gray-400 italic">—</span>
      ),
  },
  {
    key: 'costo_usd',
    header: 'Costo (USD)',
    sortable: true,
    render: (row) => <span className="font-medium">{formatUSD(row.costo_usd)}</span>,
  },
]

export function PeripheralsListPage() {
  const navigate = useNavigate()
  const [tipoFilter, setTipoFilter] = useState<PeripheralType | ''>('')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | ''>('')
  const [ownershipFilter, setOwnershipFilter] = useState<'Bodega' | 'Colaborador' | ''>('')

  const { data: peripherals = [], isLoading } = usePeripheralList({
    tipo: tipoFilter || undefined,
    status: statusFilter || undefined,
    ownership: ownershipFilter || undefined,
  })

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Periféricos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {peripherals.length} periférico{peripherals.length !== 1 ? 's' : ''} registrado
              {peripherals.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/perifericos/nuevo')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Nuevo Periférico
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as PeripheralType | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todos los tipos</option>
            {PERIPHERAL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todos los estatus</option>
            {EQUIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value as 'Bodega' | 'Colaborador' | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todos los ownership</option>
            <option value="Bodega">Bodega</option>
            <option value="Colaborador">Colaborador</option>
          </select>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={peripherals}
          isLoading={isLoading}
          emptyMessage="No hay periféricos registrados"
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/perifericos/${row.id}`)}
        />
      </div>
    </Layout>
  )
}
