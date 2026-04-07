# License Dashboard — Design Spec

**Date:** 2026-04-07  
**Status:** Approved  

---

## Overview

Replace the current flat list view at `/licenses` with a product-grouped gallery of cards. Each card represents a unique license product (e.g. "Sage HR") and provides a quick overview. Clicking through opens a full per-product dashboard at `/licenses/product/:name`.

No database schema changes are required. Grouping is done on the frontend by aggregating existing `License` records by `nombre_producto`.

---

## Routes

| Route | Component | Notes |
|---|---|---|
| `/licenses` | `LicensesGalleryPage` | Replaces `LicensesListPage` |
| `/licenses/product/:name` | `LicenseProductDashboard` | New page |
| `/licenses/:id` | `LicenseDetailPage` | Unchanged |
| `/licenses/new` | `LicenseFormPage` | Unchanged |
| `/licenses/:id/edit` | `LicenseFormPage` | Unchanged |

> **Route ordering:** `/licenses/product/:name` and `/licenses/new` must be registered before `/licenses/:id` to avoid `:id` capturing those segments.

---

## Data Layer

### New hook: `useLicensesByProduct(filters?)`

Wraps `useLicenses()` and groups results by `nombre_producto`. Returns `ProductGroup[]`:

```ts
interface ProductGroup {
  nombre_producto: string
  categoria: LicenseCategory        // from first record (all records share same product)
  licenses: License[]               // all licenses for this product
  activeCount: number               // licenses where activa === true
  inactiveCount: number
  totalCostUSD: number              // sum of costo_usd for active licenses
  collaboratorIds: string[]         // collaborator_id list (active licenses)
  nextRenewal: { date: string; colaborador_id: string } | null  // earliest fecha_renovacion
}
```

Filters accepted: `categoria`, `activa`.

---

## Screen 1: Licenses Gallery (`/licenses`)

### Header
- Title: "Licenses"
- Button: "+ New License" → `/licenses/new`

### Filters (top bar)
- Category: All / IY / General
- Status: All / Active / Inactive

### Grid layout
Responsive: 1 col (mobile) → 2 col (tablet) → 3 col (desktop).

### `ProductCard` component

**Always visible:**
- Product name (title)
- Category badge (IY: indigo · General: gray)
- KPI row: collaborator count · total cost USD · next renewal date
- Renewal alert badge (red) if next renewal is ≤ 7 days away
- "View dashboard →" button → `/licenses/product/:name`
- Accordion toggle button

**Accordion (collapsed by default):**
- List of collaborators: name · individual cost USD · renewal date
- Each collaborator row shows a warning badge if their renewal is ≤ 7 days away
- Accordions are independent — opening one does not close others

---

## Screen 2: Product Dashboard (`/licenses/product/:name`)

### Header
- "← Back" button
- Product name + category badge
- "+ Add License" button → `/licenses/new?product=:name` (pre-fills `nombre_producto`)

### KPI Cards (top row, 4 cards)
1. **Active collaborators** — count of active licenses
2. **Total monthly cost (USD)** — sum of `costo_usd` for active licenses
3. **Next renewal** — earliest `fecha_renovacion` + collaborator name
4. **Active / Inactive** — `X active · Y inactive`

### Renewal Alert Banner
Shown above the table only when ≥ 1 license expires in ≤ 7 days. Lists affected collaborators and their renewal dates.

### Collaborators Table

Columns: Collaborator · Type · Cost (USD) · Renewal · Status · Actions

**Actions per row:**
- **Reassign** — opens modal with collaborator selector (reuses existing reassign flow)
- **Edit** — navigates to `/licenses/:id/edit`
- **Deactivate** — inline confirmation modal

Table shows all licenses for the product (active and inactive). Status column distinguishes them visually.

---

## New Components

| Component | Location | Purpose |
|---|---|---|
| `LicensesGalleryPage` | `src/pages/licencias/` | Replaces `LicensesListPage` as the index route |
| `ProductCard` | `src/components/shared/` | Card with accordion for the gallery |
| `LicenseProductDashboard` | `src/pages/licencias/` | Per-product dashboard page |

### Existing components reused
- `Modal` — for reassign action
- `ConfirmModal` — for deactivate action
- `useReassignLicense`, `useDeactivateLicense` — existing mutations
- `formatUSD`, `formatDate`, `daysUntil` — existing utilities
- `RenewalBadge` — extract from `LicenseDetailPage` into shared component

---

## Error Handling

- If `/licenses/product/:name` receives a name that matches no licenses → show empty state with "No licenses found for this product" and a back button.
- Reassign / deactivate failures → toast error (existing pattern).
- Data loading → skeleton placeholders consistent with existing pages.

---

## Testing

- Unit test `useLicensesByProduct` grouping logic — verify cost summation, activeCount, nextRenewal calculation, and ≤ 7 day alert flag.
- Existing license service tests remain unchanged.
- No E2E tests added (existing Playwright suite covers the license flow).
