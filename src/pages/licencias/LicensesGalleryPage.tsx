import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { EmptyState } from '../../components/shared/EmptyState'
import { ProductCard } from '../../components/shared/ProductCard'
import { useLicensesByProduct } from '../../hooks/useLicenses'
import { useCollaborators } from '../../hooks/useCollaborators'
import type { LicenseCategory } from '../../types'

const INPUT_CLASS =
  'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[0, 1, 2].map((j) => (
              <div key={j} className="space-y-1">
                <div className="h-2 bg-gray-100 rounded" />
                <div className="h-5 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function LicensesGalleryPage() {
  const navigate = useNavigate()
  const [categoria, setCategoria] = useState<LicenseCategory | ''>('')
  const [activaFilter, setActivaFilter] = useState<'' | 'true' | 'false'>('')

  const filters = {
    categoria: (categoria || undefined) as LicenseCategory | undefined,
    activa: activaFilter === '' ? undefined : activaFilter === 'true',
  }

  const { data: groups = [], isLoading } = useLicensesByProduct(filters)
  const { data: collaborators = [] } = useCollaborators()

  const collaboratorNames = Object.fromEntries(
    collaborators.map((c) => [c.id, c.nombre])
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Licenses</h1>
          <button
            onClick={() => navigate('/licenses/new')}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New License
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as LicenseCategory | '')}
            className={INPUT_CLASS}
          >
            <option value="">All categories</option>
            <option value="IY">IY</option>
            <option value="General">General</option>
          </select>

          <select
            value={activaFilter}
            onChange={(e) => setActivaFilter(e.target.value as '' | 'true' | 'false')}
            className={INPUT_CLASS}
          >
            <option value="">Active &amp; inactive</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>

        {/* Gallery */}
        {isLoading ? (
          <GallerySkeleton />
        ) : groups.length === 0 ? (
          <EmptyState
            title="No licenses found"
            description="No licenses match the selected filters"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <ProductCard
                key={group.nombre_producto}
                group={group}
                collaboratorNames={collaboratorNames}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
