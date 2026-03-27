import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNotifications } from './useNotifications'

vi.mock('./useNotificationConfig', () => ({
  useNotificationConfig: vi.fn(),
}))
vi.mock('./useLicenses', () => ({
  useExpiringSoonLicenses: vi.fn(),
}))

import { useNotificationConfig } from './useNotificationConfig'
import { useExpiringSoonLicenses } from './useLicenses'

const mockConfig = vi.mocked(useNotificationConfig)
const mockExpiring = vi.mocked(useExpiringSoonLicenses)

const makeLicense = (id: string) => ({
  id, nombre_producto: 'Test', tipo: 'Mensual' as const, costo_mxn: 100, costo_usd: 6,
  fecha_renovacion: '2025-04-01', colaborador_id: 'c1', categoria: 'General' as const,
  activa: true, created_at: '', updated_at: '',
})

describe('useNotifications', () => {
  it('usa 7 días como default cuando no hay configuración', () => {
    mockConfig.mockReturnValue({ data: undefined, isLoading: false } as never)
    mockExpiring.mockReturnValue({ data: [], isLoading: false } as never)

    const { result } = renderHook(() => useNotifications())

    expect(result.current.daysAhead).toBe(7)
    expect(mockExpiring).toHaveBeenCalledWith(7)
  })

  it('usa los días configurados cuando existe configuración', () => {
    const config = { id: 'cfg1', dias_anticipacion: 14, admin_id: null, created_at: '', updated_at: '' }
    mockConfig.mockReturnValue({ data: config, isLoading: false } as never)
    mockExpiring.mockReturnValue({ data: [], isLoading: false } as never)

    const { result } = renderHook(() => useNotifications())

    expect(result.current.daysAhead).toBe(14)
    expect(mockExpiring).toHaveBeenCalledWith(14)
  })

  it('hasAlerts es false cuando no hay licencias por vencer', () => {
    mockConfig.mockReturnValue({ data: undefined, isLoading: false } as never)
    mockExpiring.mockReturnValue({ data: [], isLoading: false } as never)

    const { result } = renderHook(() => useNotifications())

    expect(result.current.hasAlerts).toBe(false)
    expect(result.current.expiringSoon).toEqual([])
  })

  it('hasAlerts es true cuando hay licencias por vencer', () => {
    mockConfig.mockReturnValue({ data: undefined, isLoading: false } as never)
    mockExpiring.mockReturnValue({ data: [makeLicense('l1'), makeLicense('l2')], isLoading: false } as never)

    const { result } = renderHook(() => useNotifications())

    expect(result.current.hasAlerts).toBe(true)
    expect(result.current.expiringSoon).toHaveLength(2)
  })

  it('retorna expiringSoon vacío cuando data es undefined', () => {
    mockConfig.mockReturnValue({ data: undefined, isLoading: false } as never)
    mockExpiring.mockReturnValue({ data: undefined, isLoading: true } as never)

    const { result } = renderHook(() => useNotifications())

    expect(result.current.expiringSoon).toEqual([])
    expect(result.current.hasAlerts).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })
})
