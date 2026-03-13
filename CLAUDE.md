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

## Domain

Inventory management app for Simpat Tech. Tracks equipment, peripherals, licenses, office items, and collaborators. Key rules:

- All monetary values are stored in **both MXN and USD** using the Banxico exchange rate at time of entry (`VITE_BANXICO_TOKEN` required for the Banxico API)
- Reports are displayed in **USD only**
- License categories: `IY` (Improve Yourself — per-collaborator budget) and `General`
- Equipment/peripheral statuses: `Asignado | En Bodega | En Reparación | Vendido | Dado de Baja | Solicitado`
- Peripherals have independent `ownership` (Bodega or Collaborador) and `estatus` fields
- Deactivating a collaborator is a soft delete — history is preserved, IY licenses trigger an alert

All domain types are defined in `src/types/index.ts`.
