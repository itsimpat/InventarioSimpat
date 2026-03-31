import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Table } from '../../components/shared/Table'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { EmptyState } from '../../components/shared/EmptyState'
import { useCollaborators } from '../../hooks/useCollaborators'
import { formatDate } from '../../utils/dates'
import type { Collaborator } from '../../types'
import type { Column } from '../../components/shared/Table'

export function CollaboratorsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [activo, setActivo] = useState<boolean | undefined>(true)

  const { data: collaborators = [], isLoading } = useCollaborators({
    search: search || undefined,
    area: area || undefined,
    activo,
  })

  const columns: Column<Collaborator>[] = [
    {
      key: 'nombre',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.nombre}</span>
      ),
    },
    {
      key: 'area',
      header: 'Area',
      sortable: true,
    },
    {
      key: 'puesto',
      header: 'Position',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'activo',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.activo ? 'Assigned' : 'Decommissioned'} size="sm" />
      ),
    },
    {
      key: 'fecha_ingreso',
      header: 'Start date',
      sortable: true,
      render: (row) => formatDate(row.fecha_ingreso),
    },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Collaborators</h1>
          <button
            onClick={() => navigate('/collaborators/new')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Collaborator
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
          <input
            type="text"
            placeholder="Filter by area..."
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => setActivo(true)}
              className={`px-4 py-2 ${
                activo === true
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } transition-colors`}
            >
              Active
            </button>
            <button
              onClick={() => setActivo(false)}
              className={`px-4 py-2 border-l border-gray-300 ${
                activo === false
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } transition-colors`}
            >
              Inactive
            </button>
            <button
              onClick={() => setActivo(undefined)}
              className={`px-4 py-2 border-l border-gray-300 ${
                activo === undefined
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } transition-colors`}
            >
              All
            </button>
          </div>
        </div>

        {/* Table */}
        {!isLoading && collaborators.length === 0 && !search && !area ? (
          <EmptyState
            title="No collaborators"
            description="Create the first collaborator to get started"
            action={{ label: '+ New Collaborator', onClick: () => navigate('/collaborators/new') }}
          />
        ) : (
          <Table
            columns={columns}
            data={collaborators}
            isLoading={isLoading}
            emptyMessage="No collaborators found"
            keyExtractor={(row) => row.id}
            onRowClick={(row) => navigate(`/collaborators/${row.id}`)}
          />
        )}
      </div>
    </Layout>
  )
}
