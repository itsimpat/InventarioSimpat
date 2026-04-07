# License Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat `/licenses` list with a product-grouped gallery of cards; add a per-product dashboard at `/licenses/product/:name` with KPIs, collaborator table, and inline actions.

**Architecture:** All grouping is done on the frontend — a pure utility function (`groupLicensesByProduct`) aggregates existing `License[]` by `nombre_producto`, and a React Query hook wraps it. Two new pages (`LicensesGalleryPage`, `LicenseProductDashboard`) and one new shared component (`ProductCard`) are added. `App.tsx` routes are updated. No DB schema changes.

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, React Query (`@tanstack/react-query`), React Router v6, Vitest + Testing Library

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/utils/licenseGrouping.ts` | Pure grouping logic + `ProductGroup` type |
| Create | `src/utils/licenseGrouping.test.ts` | Unit tests for grouping |
| Modify | `src/hooks/useLicenses.ts` | Add `useLicensesByProduct` hook |
| Modify | `src/components/shared/RenewalBadge.tsx` | Extract from `LicenseDetailPage` |
| Modify | `src/pages/licencias/LicenseDetailPage.tsx` | Import `RenewalBadge` from shared |
| Create | `src/components/shared/ProductCard.tsx` | Gallery card with accordion |
| Create | `src/pages/licencias/LicensesGalleryPage.tsx` | Gallery index page |
| Modify | `src/pages/licencias/LicenseFormPage.tsx` | Read `?product=` query param to pre-fill |
| Create | `src/pages/licencias/LicenseProductDashboard.tsx` | Per-product dashboard page |
| Modify | `src/App.tsx` | Add new routes, swap gallery page |

---

## Task 1: Pure grouping utility

**Files:**
- Create: `src/utils/licenseGrouping.ts`
- Create: `src/utils/licenseGrouping.test.ts`

- [ ] **Step 1: Create the utility with the `ProductGroup` type**

Create `src/utils/licenseGrouping.ts`:

```ts
import type { License, LicenseCategory } from '../types'

export interface ProductGroup {
  nombre_producto: string
  categoria: LicenseCategory
  licenses: License[]
  activeCount: number
  inactiveCount: number
  totalCostUSD: number
  collaboratorIds: string[]
  nextRenewal: { date: string; colaborador_id: string } | null
}

export function groupLicensesByProduct(licenses: License[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>()

  for (const license of licenses) {
    const key = license.nombre_producto
    if (!map.has(key)) {
      map.set(key, {
        nombre_producto: key,
        categoria: license.categoria,
        licenses: [],
        activeCount: 0,
        inactiveCount: 0,
        totalCostUSD: 0,
        collaboratorIds: [],
        nextRenewal: null,
      })
    }
    const group = map.get(key)!
    group.licenses.push(license)
    if (license.activa) {
      group.activeCount++
      group.totalCostUSD += license.costo_usd
      group.collaboratorIds.push(license.colaborador_id)
      if (!group.nextRenewal || license.fecha_renovacion < group.nextRenewal.date) {
        group.nextRenewal = { date: license.fecha_renovacion, colaborador_id: license.colaborador_id }
      }
    } else {
      group.inactiveCount++
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombre_producto.localeCompare(b.nombre_producto)
  )
}
```

- [ ] **Step 2: Write tests**

Create `src/utils/licenseGrouping.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { groupLicensesByProduct } from './licenseGrouping'
import type { License } from '../types'

const base: License = {
  id: 'l1',
  nombre_producto: 'GitHub Copilot',
  tipo: 'Monthly',
  costo_mxn: 340,
  costo_usd: 20,
  fecha_renovacion: '2026-05-01',
  colaborador_id: 'c1',
  categoria: 'IY',
  activa: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

describe('groupLicensesByProduct', () => {
  it('groups licenses by nombre_producto', () => {
    const l2 = { ...base, id: 'l2', colaborador_id: 'c2', costo_usd: 20 }
    const result = groupLicensesByProduct([base, l2])
    expect(result).toHaveLength(1)
    expect(result[0].licenses).toHaveLength(2)
  })

  it('separates two distinct products', () => {
    const l2 = { ...base, id: 'l2', nombre_producto: 'Sage HR', categoria: 'General' as const }
    const result = groupLicensesByProduct([base, l2])
    expect(result).toHaveLength(2)
    expect(result.map((g) => g.nombre_producto).sort()).toEqual(['GitHub Copilot', 'Sage HR'])
  })

  it('sums totalCostUSD for active licenses only', () => {
    const l2 = { ...base, id: 'l2', colaborador_id: 'c2', costo_usd: 30, activa: false }
    const result = groupLicensesByProduct([base, l2])
    expect(result[0].totalCostUSD).toBe(20)
  })

  it('counts activeCount and inactiveCount correctly', () => {
    const l2 = { ...base, id: 'l2', colaborador_id: 'c2', activa: false }
    const result = groupLicensesByProduct([base, l2])
    expect(result[0].activeCount).toBe(1)
    expect(result[0].inactiveCount).toBe(1)
  })

  it('picks the earliest fecha_renovacion as nextRenewal', () => {
    const l2 = { ...base, id: 'l2', colaborador_id: 'c2', fecha_renovacion: '2026-04-10' }
    const result = groupLicensesByProduct([base, l2])
    expect(result[0].nextRenewal?.date).toBe('2026-04-10')
    expect(result[0].nextRenewal?.colaborador_id).toBe('c2')
  })

  it('nextRenewal is null when no active licenses', () => {
    const inactive = { ...base, activa: false }
    const result = groupLicensesByProduct([inactive])
    expect(result[0].nextRenewal).toBeNull()
  })

  it('returns groups sorted alphabetically', () => {
    const l2 = { ...base, id: 'l2', nombre_producto: 'Asana' }
    const result = groupLicensesByProduct([base, l2])
    expect(result[0].nombre_producto).toBe('Asana')
  })

  it('returns empty array for empty input', () => {
    expect(groupLicensesByProduct([])).toEqual([])
  })
})
```

- [ ] **Step 3: Run tests — verify they pass**

```bash
npx vitest run src/utils/licenseGrouping.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/licenseGrouping.ts src/utils/licenseGrouping.test.ts
git commit -m "feat: add groupLicensesByProduct utility with tests"
```

---

## Task 2: `useLicensesByProduct` hook

**Files:**
- Modify: `src/hooks/useLicenses.ts`

- [ ] **Step 1: Add the hook at the end of `src/hooks/useLicenses.ts`**

Add after the last export:

```ts
import { groupLicensesByProduct } from '../utils/licenseGrouping'
import type { ProductGroup } from '../utils/licenseGrouping'

export type { ProductGroup }

export function useLicensesByProduct(filters?: LicenseFilters) {
  const query = useLicenses(filters)
  return {
    ...query,
    data: query.data ? groupLicensesByProduct(query.data) : undefined,
  }
}
```

> Note: the `import` statements go at the top of the file with the existing imports.

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLicenses.ts
git commit -m "feat: add useLicensesByProduct hook"
```

---

## Task 3: Extract `RenewalBadge` to shared component

**Files:**
- Create: `src/components/shared/RenewalBadge.tsx`
- Modify: `src/pages/licencias/LicenseDetailPage.tsx`

- [ ] **Step 1: Create `src/components/shared/RenewalBadge.tsx`**

```tsx
import { daysUntil } from '../../utils/dates'

interface Props {
  fecha: string
}

export function RenewalBadge({ fecha }: Props) {
  const days = daysUntil(fecha)
  const colorClass =
    days < 7
      ? 'bg-red-100 text-red-800'
      : days <= 30
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800'

  const label =
    days < 0
      ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
      : days === 0
      ? 'Expires today'
      : days === 1
      ? 'Expires in 1 day'
      : `Expires in ${days} days`

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Update `LicenseDetailPage.tsx`**

Remove the local `RenewalBadge` function definition and add this import near the top with the other shared component imports:

```ts
import { RenewalBadge } from '../../components/shared/RenewalBadge'
```

- [ ] **Step 3: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/RenewalBadge.tsx src/pages/licencias/LicenseDetailPage.tsx
git commit -m "refactor: extract RenewalBadge into shared component"
```

---

## Task 4: `ProductCard` component

**Files:**
- Create: `src/components/shared/ProductCard.tsx`

- [ ] **Step 1: Create `src/components/shared/ProductCard.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProductGroup } from '../../hooks/useLicenses'
import { formatUSD } from '../../utils/currency'
import { formatDate, daysUntil } from '../../utils/dates'

interface Props {
  group: ProductGroup
  collaboratorNames: Record<string, string>
}

export function ProductCard({ group, collaboratorNames }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const nextDays = group.nextRenewal ? daysUntil(group.nextRenewal.date) : null
  const isUrgent = nextDays !== null && nextDays <= 7

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
      {/* Card header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-gray-900 leading-tight">
            {group.nombre_producto}
          </h3>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
              group.categoria === 'IY'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {group.categoria}
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Collaborators</p>
            <p className="text-lg font-bold text-gray-900">{group.activeCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total USD</p>
            <p className="text-lg font-bold text-gray-900">{formatUSD(group.totalCostUSD)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Next renewal</p>
            {group.nextRenewal ? (
              <p className={`text-sm font-medium ${isUrgent ? 'text-red-700' : 'text-gray-700'}`}>
                {formatDate(group.nextRenewal.date)}
                {isUrgent && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                    ≤7d
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>

        {/* Accordion toggle */}
        {group.activeCount > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <span>{open ? '▲' : '▼'}</span>
            <span>{open ? 'Hide' : 'Show'} collaborators</span>
          </button>
        )}

        {/* Accordion body */}
        {open && (
          <ul className="mt-3 divide-y divide-gray-50 border-t border-gray-100 pt-2">
            {group.licenses
              .filter((l) => l.activa)
              .map((l) => {
                const days = daysUntil(l.fecha_renovacion)
                const urgent = days <= 7
                return (
                  <li key={l.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-800 truncate">
                      {collaboratorNames[l.colaborador_id] ?? l.colaborador_id}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">{formatUSD(l.costo_usd)}</span>
                      <span className={`text-xs ${urgent ? 'text-red-700 font-semibold' : 'text-gray-400'}`}>
                        {formatDate(l.fecha_renovacion)}
                        {urgent && (
                          <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                            ≤7d
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <button
          onClick={() => navigate(`/licenses/product/${encodeURIComponent(group.nombre_producto)}`)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View dashboard →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/ProductCard.tsx
git commit -m "feat: add ProductCard component with accordion"
```

---

## Task 5: `LicensesGalleryPage`

**Files:**
- Create: `src/pages/licencias/LicensesGalleryPage.tsx`

- [ ] **Step 1: Create `src/pages/licencias/LicensesGalleryPage.tsx`**

```tsx
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
```

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/licencias/LicensesGalleryPage.tsx
git commit -m "feat: add LicensesGalleryPage with product card grid"
```

---

## Task 6: Support `?product=` query param in `LicenseFormPage`

**Files:**
- Modify: `src/pages/licencias/LicenseFormPage.tsx`

- [ ] **Step 1: Add `useSearchParams` import and read `?product=`**

In `src/pages/licencias/LicenseFormPage.tsx`, add `useSearchParams` to the `react-router-dom` import line:

```ts
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
```

- [ ] **Step 2: Read the param and use it as default value**

Inside `LicenseFormPage`, after `const isEdit = !!id`, add:

```ts
const [searchParams] = useSearchParams()
const productFromQuery = searchParams.get('product') ?? ''
```

- [ ] **Step 3: Use `productFromQuery` as `defaultValues`**

Find the `useForm` call that has `defaultValues` and add `nombre_producto: productFromQuery` to the non-edit branch. The `defaultValues` object should look like:

```ts
defaultValues: isEdit
  ? undefined
  : {
      nombre_producto: productFromQuery,
      tipo: 'Monthly' as const,
      categoria: 'General' as const,
      costo_usd: 0,
      fecha_renovacion: '',
      colaborador_id: '',
      activa: true,
    },
```

> Check the existing `useForm` call to preserve any existing default values — only add/change `nombre_producto`.

- [ ] **Step 4: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/licencias/LicenseFormPage.tsx
git commit -m "feat: pre-fill nombre_producto from ?product= query param in LicenseFormPage"
```

---

## Task 7: `LicenseProductDashboard` page

**Files:**
- Create: `src/pages/licencias/LicenseProductDashboard.tsx`

- [ ] **Step 1: Create `src/pages/licencias/LicenseProductDashboard.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import { Modal } from '../../components/shared/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { useToast } from '../../components/shared/Toast'
import { useLicenses, useDeactivateLicense, useReassignLicense } from '../../hooks/useLicenses'
import { useCollaborators } from '../../hooks/useCollaborators'
import { formatUSD } from '../../utils/currency'
import { formatDate, daysUntil } from '../../utils/dates'
import type { License } from '../../types'

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export function LicenseProductDashboard() {
  const navigate = useNavigate()
  const { name } = useParams<{ name: string }>()
  const productName = decodeURIComponent(name ?? '')
  const { toast } = useToast()

  const { data: allLicenses = [], isLoading } = useLicenses()
  const { data: collaborators = [] } = useCollaborators()

  const deactivateMutation = useDeactivateLicense()
  const reassignMutation = useReassignLicense()

  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const [reassignLicense, setReassignLicense] = useState<License | null>(null)
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('')

  const licenses = allLicenses.filter((l) => l.nombre_producto === productName)
  const activeLicenses = licenses.filter((l) => l.activa)

  const collaboratorMap = Object.fromEntries(collaborators.map((c) => [c.id, c.nombre]))
  const activeCollaborators = collaborators.filter((c) => c.activo)

  const totalCostUSD = activeLicenses.reduce((sum, l) => sum + l.costo_usd, 0)
  const nextRenewal = activeLicenses.reduce<License | null>((earliest, l) => {
    if (!earliest || l.fecha_renovacion < earliest.fecha_renovacion) return l
    return earliest
  }, null)

  const urgentLicenses = activeLicenses.filter((l) => daysUntil(l.fecha_renovacion) <= 7)

  async function handleDeactivate() {
    if (!deactivateId) return
    try {
      await deactivateMutation.mutateAsync(deactivateId)
      toast('License deactivated successfully', 'success')
      setDeactivateId(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error deactivating license', 'error')
    }
  }

  async function handleReassign() {
    if (!reassignLicense || !selectedCollaboratorId) return
    try {
      await reassignMutation.mutateAsync({ licenseId: reassignLicense.id, newCollaboratorId: selectedCollaboratorId })
      toast('License reassigned successfully', 'success')
      setReassignLicense(null)
      setSelectedCollaboratorId('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error reassigning license', 'error')
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      </Layout>
    )
  }

  if (licenses.length === 0) {
    return (
      <Layout>
        <div className="space-y-4">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">← Back</button>
          <EmptyState title="No licenses found" description={`No licenses found for "${productName}"`} />
        </div>
      </Layout>
    )
  }

  const categoria = licenses[0].categoria

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-gray-900">{productName}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  categoria === 'IY' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {categoria}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/licenses/new?product=${encodeURIComponent(productName)}`)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add License
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="Active collaborators" value={activeLicenses.length} />
          <KPICard label="Total cost (USD)" value={formatUSD(totalCostUSD)} />
          <KPICard
            label="Next renewal"
            value={nextRenewal ? formatDate(nextRenewal.fecha_renovacion) : '—'}
            sub={nextRenewal ? collaboratorMap[nextRenewal.colaborador_id] : undefined}
          />
          <KPICard
            label="Status"
            value={`${activeLicenses.length} active`}
            sub={`${licenses.length - activeLicenses.length} inactive`}
          />
        </div>

        {/* Renewal alert banner */}
        {urgentLicenses.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-red-800 mb-2">
              ⚠ {urgentLicenses.length} license{urgentLicenses.length > 1 ? 's' : ''} expiring in ≤7 days
            </p>
            <ul className="space-y-1">
              {urgentLicenses.map((l) => (
                <li key={l.id} className="text-sm text-red-700">
                  {collaboratorMap[l.colaborador_id] ?? l.colaborador_id} — {formatDate(l.fecha_renovacion)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Collaborators table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Collaborators</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Collaborator', 'Type', 'Cost (USD)', 'Renewal', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {licenses.map((l) => {
                  const days = daysUntil(l.fecha_renovacion)
                  const urgent = days <= 7 && l.activa
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {collaboratorMap[l.colaborador_id] ?? l.colaborador_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{l.tipo}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatUSD(l.costo_usd)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={urgent ? 'font-semibold text-red-700' : 'text-gray-600'}>
                          {formatDate(l.fecha_renovacion)}
                          {urgent && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                              ≤7d
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            l.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {l.activa ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setReassignLicense(l); setSelectedCollaboratorId(l.colaborador_id) }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => navigate(`/licenses/${l.id}/edit`)}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Edit
                          </button>
                          {l.activa && (
                            <button
                              onClick={() => setDeactivateId(l.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deactivate modal */}
      <ConfirmModal
        isOpen={!!deactivateId}
        title="Deactivate license"
        message={`Are you sure you want to deactivate this license for "${productName}"?`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
        isLoading={deactivateMutation.isPending}
      />

      {/* Reassign modal */}
      <Modal
        isOpen={!!reassignLicense}
        onClose={() => setReassignLicense(null)}
        title="Reassign license"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">New collaborator</label>
            <select
              value={selectedCollaboratorId}
              onChange={(e) => setSelectedCollaboratorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select a collaborator...</option>
              {activeCollaborators.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setReassignLicense(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={!selectedCollaboratorId || reassignMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {reassignMutation.isPending ? 'Reassigning...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
```

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/licencias/LicenseProductDashboard.tsx
git commit -m "feat: add LicenseProductDashboard page"
```

---

## Task 8: Wire up routes in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy imports for the two new pages**

After the existing `LicenseDetailPage` lazy import, add:

```ts
const LicensesGalleryPage = lazy(() =>
  import('./pages/licencias/LicensesGalleryPage').then((m) => ({ default: m.LicensesGalleryPage })).catch(() => ({ default: PlaceholderPage }))
)
const LicenseProductDashboard = lazy(() =>
  import('./pages/licencias/LicenseProductDashboard').then((m) => ({ default: m.LicenseProductDashboard })).catch(() => ({ default: PlaceholderPage }))
)
```

- [ ] **Step 2: Replace and add routes in the Licenses section**

Find the existing Licenses routes block in `App.tsx` and replace it entirely with:

```tsx
{/* Licenses */}
<Route
  path="/licenses"
  element={
    <ProtectedRoute>
      <SuspenseWrapper><LicensesGalleryPage /></SuspenseWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/licenses/new"
  element={
    <ProtectedRoute>
      <SuspenseWrapper><LicenseFormPage /></SuspenseWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/licenses/product/:name"
  element={
    <ProtectedRoute>
      <SuspenseWrapper><LicenseProductDashboard /></SuspenseWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/licenses/:id"
  element={
    <ProtectedRoute>
      <SuspenseWrapper><LicenseDetailPage /></SuspenseWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/licenses/:id/edit"
  element={
    <ProtectedRoute>
      <SuspenseWrapper><LicenseFormPage /></SuspenseWrapper>
    </ProtectedRoute>
  }
/>
```

> Note: `/licenses/new` and `/licenses/product/:name` must appear **before** `/licenses/:id` to prevent the dynamic segment from capturing them.

- [ ] **Step 3: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the dev server and verify manually**

```bash
npm run dev
```

Visit:
- `http://localhost:5173/licenses` — should show the product card gallery
- Click a card's "View dashboard →" — should open `/licenses/product/<name>` with KPIs and table
- Click "+ Add License" on the dashboard — form should open with `nombre_producto` pre-filled
- Click "Reassign" on a row — modal should open
- Click "Deactivate" — confirmation modal should appear

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up license gallery and product dashboard routes"
```

---

## Task 9: Final type-check and test run

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass, including the new `licenseGrouping.test.ts`.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: address any issues from final build check"
```
