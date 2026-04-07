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

  it('deduplicates collaboratorIds when same collaborator has multiple active licenses', () => {
    const l2 = { ...base, id: 'l2' } // same colaborador_id as base ('c1')
    const result = groupLicensesByProduct([base, l2])
    expect(result[0].collaboratorIds).toEqual(['c1'])
  })
})
