# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, localhost:5173)
npm run build      # Type-check + production build
npm run lint       # ESLint
npm run preview    # Preview production build
npx tsc --noEmit   # Type-check only
```

### Unit Tests (Vitest)

```bash
npm test                          # Watch mode
npm run test:run                  # Run once (CI)
npx vitest run src/path/to/file   # Run a single test file
```

Unit tests use `jsdom` + `@testing-library/react`. Tests co-locate with source or live in `src/services/*.test.ts`. The shared mock builder for InsForge queries is in `src/test/mockInsforge.ts` — use `makeBuilder()` to stub the fluent query chain.

### E2E Tests (Playwright)

```bash
npx playwright test           # Run all e2e tests (starts dev server automatically)
npx playwright test --ui      # Open interactive UI mode
npx playwright test --headed  # Run with visible browser
npx playwright show-report    # Open last HTML report
```

Tests live in `e2e/`. Config in `playwright.config.ts` — runs against `localhost:5173`, Chromium only.

## Architecture

**Stack:** Vite + React 19 + TypeScript + TailwindCSS v4 + InsForge (BaaS)

**InsForge** is the backend — database, auth, and storage are all managed through `@insforge/sdk`. The single client instance lives in `src/lib/insforge.ts` and is imported everywhere that needs DB or auth access. Project is linked to InsForge via `.insforge/project.json`.

**Environment:** `VITE_INSFORGE_URL` and `VITE_INSFORGE_API_KEY` must be set in `.env` (not committed). See `.env.example`.

**TailwindCSS v4** is configured via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`. The import `@import "tailwindcss"` in `src/index.css` is all that's needed.

**Source layout:**
- `src/lib/` — third-party client instances (InsForge)
- `src/types/` — shared TypeScript types for all domain entities
- `src/pages/` — route-level components
- `src/components/` — reusable UI components
- `src/hooks/` — custom React hooks
- `src/services/` — data-fetching functions that call InsForge
- `src/utils/` — pure utility functions
- `functions/` — InsForge edge functions (Deno runtime). `banxico-rate.ts` proxies the Banxico API and requires `BANXICO_TOKEN` set in the InsForge project environment (not in `.env`).

**Data layer pattern:** Services (`src/services/`) call `insforge.database.from(table)` directly and return typed domain objects. Hooks (`src/hooks/`) wrap services with React Query — each entity has `useXxx` (list), `useXxx(id)` (single), `useCreateXxx`, `useUpdateXxx`, etc. All mutations call `queryClient.invalidateQueries` on success.

**Auth:** Only users with `profile.role === 'admin'` can sign in — the check is enforced in `AuthContext.signIn`. `ProtectedRoute` redirects unauthenticated users to `/login`. The `useAuth()` hook exposes `user`, `isAdmin`, `signIn`, `signOut`.

**Mixed naming:** Domain types in `src/types/index.ts` use English for TypeScript type/enum names but Spanish for database column names (e.g., `nombre`, `activo`, `colaborador_id`, `costo_mxn`). Keep this convention when adding fields — the column names must match the InsForge schema.

## Domain

Inventory management app for Simpat Tech. Tracks equipment, peripherals, licenses, office items, and collaborators. Key rules:

- All monetary values are stored in **both MXN and USD** using the Banxico exchange rate at time of entry (`VITE_BANXICO_TOKEN` required for the Banxico API)
- Reports are displayed in **USD only**
- License categories: `IY` (Improve Yourself — per-collaborator budget) and `General`
- Equipment/peripheral statuses: `Assigned | In Storage | Under Repair | Sold | Decommissioned | Requested`
- Peripherals share `EquipmentStatus` for their `estatus` field and track `colaborador_id` for assignment
- Deactivating a collaborator is a soft delete — history is preserved, IY licenses trigger an alert

All domain types are defined in `src/types/index.ts`.

## Branching Strategy

Never commit directly to `master`. All work flows through `develop`:

1. Base all branches off `develop`, never off `master`.
2. Name branches by type: `feature/`, `fix/`, `update/`, etc. (e.g., `feature/equipment-export`, `fix/iy-budget-alert`).
3. Merge back into `develop` via PR; `master` only receives merges from `develop` once stable.
