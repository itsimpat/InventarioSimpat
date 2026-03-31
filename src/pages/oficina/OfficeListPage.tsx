import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Table } from '../../components/shared/Table'
import { useOfficeItems } from '../../hooks/useOfficeItems'
import { formatUSD } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import type { OfficeItem, OfficeItemCategory } from '../../types'

const INPUT_CLASS =
  'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

export function OfficeListPage() {
  const navigate = useNavigate()
  const [categoria, setCategoria] = useState<OfficeItemCategory | ''>('')

  const filters = {
    categoria: (categoria || undefined) as OfficeItemCategory | undefined,
  }

  const { data: items = [], isLoading } = useOfficeItems(filters)

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      render: (row: OfficeItem) => (
        <span className="font-medium text-gray-900">{row.nombre}</span>
      ),
    },
    {
      key: 'categoria',
      header: 'Category',
      render: (row: OfficeItem) => (
        <span className="text-gray-700">{row.categoria}</span>
      ),
    },
    {
      key: 'marca',
      header: 'Marca',
      render: (row: OfficeItem) => (
        <span className="text-gray-700">{row.marca || '—'}</span>
      ),
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      sortable: true,
      render: (row: OfficeItem) => (
        <span className="text-gray-700">{row.cantidad}</span>
      ),
    },
    {
      key: 'costo_usd',
      header: 'Costo USD',
      sortable: true,
      render: (row: OfficeItem) => (
        <span className="text-gray-700">{formatUSD(row.costo_usd)}</span>
      ),
    },
    {
      key: 'fecha_compra',
      header: 'Purchase date',
      sortable: true,
      render: (row: OfficeItem) => (
        <span className="text-gray-700">{formatDate(row.fecha_compra)}</span>
      ),
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Office Inventory</h1>
          <button
            onClick={() => navigate('/oficina/nuevo')}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Item
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as OfficeItemCategory | '')}
            className={INPUT_CLASS}
          >
            <option value="">All categories</option>
            <option value="Silla">Silla</option>
            <option value="Mesa">Mesa</option>
            <option value="TV">TV</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* Table */}
        <Table<OfficeItem>
          columns={columns}
          data={items}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyMessage="No office items registered"
          onRowClick={(row) => navigate(`/oficina/${row.id}`)}
        />
      </div>
    </Layout>
  )
}
