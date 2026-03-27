import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIYBudgetSummary } from './useIYBudgetSummary'

vi.mock('./useIYBudget', () => ({
  useIYBudget: vi.fn(),
}))
vi.mock('./useLicenses', () => ({
  useIYLicenses: vi.fn(),
}))

import { useIYBudget } from './useIYBudget'
import { useIYLicenses } from './useLicenses'

const mockBudget = vi.mocked(useIYBudget)
const mockLicenses = vi.mocked(useIYLicenses)

const makeBudgetData = (montoTotal: number) => ({
  id: 'b1', colaborador_id: 'c1', monto_total: montoTotal, created_at: '', updated_at: '',
})

const makeLicense = (costoUsd: number) => ({
  id: 'l1', nombre_producto: 'Test', tipo: 'Mensual' as const, costo_mxn: 100,
  costo_usd: costoUsd, fecha_renovacion: '2025-12-01', colaborador_id: 'c1',
  categoria: 'IY' as const, activa: true, created_at: '', updated_at: '',
})

describe('useIYBudgetSummary', () => {
  it('calcula montoGastado como suma de costo_usd de licencias IY', () => {
    mockBudget.mockReturnValue({ data: makeBudgetData(1000), isLoading: false } as never)
    mockLicenses.mockReturnValue({ data: [makeLicense(200), makeLicense(150)], isLoading: false } as never)

    const { result } = renderHook(() => useIYBudgetSummary('c1'))

    expect(result.current.montoTotal).toBe(1000)
    expect(result.current.montoGastado).toBeCloseTo(350)
    expect(result.current.montoDisponible).toBeCloseTo(650)
    expect(result.current.porcentajeUsado).toBeCloseTo(35)
  })

  it('retorna 0s cuando no hay presupuesto', () => {
    mockBudget.mockReturnValue({ data: undefined, isLoading: false } as never)
    mockLicenses.mockReturnValue({ data: [], isLoading: false } as never)

    const { result } = renderHook(() => useIYBudgetSummary('c1'))

    expect(result.current.montoTotal).toBe(0)
    expect(result.current.montoGastado).toBe(0)
    expect(result.current.montoDisponible).toBe(0)
    expect(result.current.porcentajeUsado).toBe(0)
  })

  it('capea porcentajeUsado en 100 cuando el gasto excede el presupuesto', () => {
    mockBudget.mockReturnValue({ data: makeBudgetData(100), isLoading: false } as never)
    mockLicenses.mockReturnValue({ data: [makeLicense(150)], isLoading: false } as never)

    const { result } = renderHook(() => useIYBudgetSummary('c1'))

    expect(result.current.porcentajeUsado).toBe(100)
    expect(result.current.montoDisponible).toBe(-50) // montoTotal - montoGastado (puede ser negativo)
  })

  it('isLoading es true cuando cualquiera de los queries carga', () => {
    mockBudget.mockReturnValue({ data: undefined, isLoading: true } as never)
    mockLicenses.mockReturnValue({ data: [], isLoading: false } as never)

    const { result } = renderHook(() => useIYBudgetSummary('c1'))
    expect(result.current.isLoading).toBe(true)
  })

  it('isLoading es true cuando las licencias están cargando', () => {
    mockBudget.mockReturnValue({ data: makeBudgetData(500), isLoading: false } as never)
    mockLicenses.mockReturnValue({ data: undefined, isLoading: true } as never)

    const { result } = renderHook(() => useIYBudgetSummary('c1'))
    expect(result.current.isLoading).toBe(true)
  })

  it('isLoading es false cuando ambos queries terminaron', () => {
    mockBudget.mockReturnValue({ data: makeBudgetData(500), isLoading: false } as never)
    mockLicenses.mockReturnValue({ data: [], isLoading: false } as never)

    const { result } = renderHook(() => useIYBudgetSummary('c1'))
    expect(result.current.isLoading).toBe(false)
  })
})
