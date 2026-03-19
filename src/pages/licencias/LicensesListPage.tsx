import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Table } from '../../components/shared/Table'
import { useLicenses } from '../../hooks/useLicenses'
import { useCollaborators } from '../../hooks/useCollaborators'
import { formatUSD } from '../../utils/currency'
import { formatDate, daysUntil } from '../../utils/dates'
import type { License, LicenseType, LicenseCategory } from '../../types'

const INPUT_CLASS =
  'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

export function LicensesListPage() {
  const navigate = useNavigate()

  const [collaboratorId, setCollaboratorId] = useState('')
  const [tipo, setTipo] = useState<LicenseType | ''>('')
  const [categoria, setCategoria] = useState<LicenseCategory | ''>('')
  const [activaFilter, setActivaFilter] = useState<'' | 'true' | 'false'>('')

  const filters = {
    collaboratorId: collaboratorId || undefined,
    tipo: (tipo || undefined) as LicenseType | undefined,
    categoria: (categoria || undefined) as LicenseCategory | undefined,
    activa: activaFilter === '' ? undefined : activaFilter === 'true',
  }

  const { data: licenses = [], isLoading } = useLicenses(filters)
  const { data: collaborators = [] } = useCollaborators()

  const collaboratorMap = Object.fromEntries(
    collaborators.map((c) => [c.id, c.nombre])
  )

  const columns = [
    {
      key: 'nombre_producto',
      header: 'Producto',
      sortable: true,
      render: (row: License) => (
        <span className="font-medium text-gray-900">{row.nombre_producto}</span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row: License) => (
        <span className="text-gray-700">{row.tipo}</span>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (row: License) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            row.categoria === 'IY'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.categoria}
        </span>
      ),
    },
    {
      key: 'colaborador_id',
      header: 'Colaborador',
      render: (row: License) => (
        <span className="text-gray-700">
          {collaboratorMap[row.colaborador_id] ?? '—'}
        </span>
      ),
    },
    {
      key: 'costo_usd',
      header: 'Costo USD',
      sortable: true,
      render: (row: License) => (
        <span className="text-gray-700">{formatUSD(row.costo_usd)}</span>
      ),
    },
    {
      key: 'fecha_renovacion',
      header: 'Próx. Renovación',
      sortable: true,
      render: (row: License) => {
        const days = daysUntil(row.fecha_renovacion)
        const isWarning = days >= 0 && days < 7
        return (
          <span className={isWarning ? 'font-semibold text-yellow-700' : 'text-gray-700'}>
            {formatDate(row.fecha_renovacion)}
          </span>
        )
      },
    },
    {
      key: 'activa',
      header: 'Activa',
      render: (row: License) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            row.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {row.activa ? 'Sí' : 'No'}
        </span>
      ),
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Licencias</h1>
          <button
            onClick={() => navigate('/licencias/nueva')}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Nueva Licencia
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={collaboratorId}
            onChange={(e) => setCollaboratorId(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Todos los colaboradores</option>
            {collaborators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as LicenseType | '')}
            className={INPUT_CLASS}
          >
            <option value="">Todos los tipos</option>
            <option value="Mensual">Mensual</option>
            <option value="Anual">Anual</option>
          </select>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as LicenseCategory | '')}
            className={INPUT_CLASS}
          >
            <option value="">Todas las categorías</option>
            <option value="IY">IY</option>
            <option value="General">General</option>
          </select>

          <select
            value={activaFilter}
            onChange={(e) => setActivaFilter(e.target.value as '' | 'true' | 'false')}
            className={INPUT_CLASS}
          >
            <option value="">Activa e inactiva</option>
            <option value="true">Solo activas</option>
            <option value="false">Solo inactivas</option>
          </select>
        </div>

        {/* Table */}
        <Table<License>
          columns={columns}
          data={licenses}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyMessage="No hay licencias que coincidan con los filtros"
          onRowClick={(row) => navigate(`/licencias/${row.id}`)}
        />
      </div>
    </Layout>
  )
}
