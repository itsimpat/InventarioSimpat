import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Table, type Column } from '../../components/shared/Table'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { usePeripheralList } from '../../hooks/usePeripherals'
import { formatUSD } from '../../utils/currency'
import type { Peripheral, PeripheralType, EquipmentStatus } from '../../types'

const PERIPHERAL_TYPES: PeripheralType[] = ['Monitor', 'Keyboard', 'Headphones', 'Mouse', 'Other']

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Assigned',
  'In Storage',
  'Under Repair',
  'Sold',
  'Decommissioned',
  'Requested',
]

const columns: Column<Peripheral>[] = [
  { key: 'tipo', header: 'Type', sortable: true },
  { key: 'marca', header: 'Brand', sortable: true },
  { key: 'modelo', header: 'Model', sortable: true },
  {
    key: 'estatus',
    header: 'Status',
    render: (row) => <StatusBadge status={row.estatus} />,
  },
  {
    key: 'colaborador_id',
    header: 'Ownership',
    render: (row) =>
      row.colaborador_id ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Collaborator
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Storage
        </span>
      ),
  },
  {
    key: 'colaborador_id_name',
    header: 'Collaborator',
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
  const [ownershipFilter, setOwnershipFilter] = useState<'Storage' | 'Collaborator' | ''>('')

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
            <h1 className="text-2xl font-bold text-gray-900">Peripherals</h1>
            <p className="text-sm text-gray-500 mt-1">
              {peripherals.length} item{peripherals.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button
            onClick={() => navigate('/perifericos/nuevo')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Peripheral
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as PeripheralType | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All types</option>
            {PERIPHERAL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All statuses</option>
            {EQUIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value as 'Storage' | 'Collaborator' | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All ownership</option>
            <option value="Storage">Storage</option>
            <option value="Collaborator">Collaborator</option>
          </select>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={peripherals}
          isLoading={isLoading}
          emptyMessage="No peripherals registered"
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/perifericos/${row.id}`)}
        />
      </div>
    </Layout>
  )
}
