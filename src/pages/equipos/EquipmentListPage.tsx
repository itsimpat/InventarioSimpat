import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Table, type Column } from '../../components/shared/Table'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { useEquipmentList } from '../../hooks/useEquipment'
import { formatUSD } from '../../utils/currency'
import type { Equipment, EquipmentStatus } from '../../types'

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Assigned',
  'In Storage',
  'Under Repair',
  'Sold',
  'Decommissioned',
  'Requested',
]

const columns: Column<Equipment>[] = [
  {
    key: 'marca',
    header: 'Brand',
    sortable: true,
  },
  {
    key: 'modelo',
    header: 'Model',
    sortable: true,
  },
  {
    key: 'estatus',
    header: 'Status',
    render: (row) => <StatusBadge status={row.estatus} />,
  },
  {
    key: 'colaborador_id',
    header: 'Collaborator',
    render: (row) =>
      row.colaborador_id ? (
        <span className="text-gray-700">{row.colaborador_id}</span>
      ) : (
        <span className="text-gray-400 italic">Unassigned</span>
      ),
  },
  {
    key: 'costo_usd',
    header: 'Cost (USD)',
    sortable: true,
    render: (row) => <span className="font-medium">{formatUSD(row.costo_usd)}</span>,
  },
  {
    key: 'anio_compra',
    header: 'Purchase year',
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
            <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
            <p className="text-sm text-gray-500 mt-1">
              {equipment.length} item{equipment.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <button
            onClick={() => navigate('/equipment/new')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Equipment
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All statuses</option>
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
            placeholder="Search by brand or model..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={equipment}
          isLoading={isLoading}
          emptyMessage="No equipment registered"
          keyExtractor={(row) => row.id}
          onRowClick={(row) => navigate(`/equipment/${row.id}`)}
        />
      </div>
    </Layout>
  )
}
