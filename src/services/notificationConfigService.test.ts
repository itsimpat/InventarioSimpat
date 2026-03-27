import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: { database: { from: vi.fn() } },
}))

import { insforge } from '../lib/insforge'
import { notificationConfigService } from './notificationConfigService'

const mockFrom = vi.mocked(insforge.database.from)

const configBase = {
  id: 'cfg1',
  dias_anticipacion: 7,
  admin_id: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

beforeEach(() => vi.clearAllMocks())

describe('notificationConfigService.get', () => {
  it('retorna la configuración cuando existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: configBase, error: null }))
    const result = await notificationConfigService.get()
    expect(result).toEqual(configBase)
  })

  it('retorna null cuando no hay configuración (not found)', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'not found' } }))
    const result = await notificationConfigService.get()
    expect(result).toBeNull()
  })

  it('retorna null cuando no hay configuración (no rows)', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'no rows returned' } }))
    const result = await notificationConfigService.get()
    expect(result).toBeNull()
  })

  it('lanza error para errores que no son "not found"', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'connection error' } }))
    await expect(notificationConfigService.get()).rejects.toThrow('connection error')
  })

  it('retorna null cuando data es null sin error', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    const result = await notificationConfigService.get()
    expect(result).toBeNull()
  })
})

describe('notificationConfigService.upsert', () => {
  it('actualiza la configuración existente', async () => {
    const updated = { ...configBase, dias_anticipacion: 14 }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: configBase, error: null }))   // get()
      .mockReturnValueOnce(makeBuilder({ data: updated, error: null }))      // update
    const result = await notificationConfigService.upsert(14)
    expect(result.dias_anticipacion).toBe(14)
  })

  it('crea la configuración cuando no existe', async () => {
    const created = { ...configBase, dias_anticipacion: 3 }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'not found' } }))  // get() → null
      .mockReturnValueOnce(makeBuilder({ data: created, error: null }))                   // insert
    const result = await notificationConfigService.upsert(3)
    expect(result.dias_anticipacion).toBe(3)
  })

  it('lanza error cuando falla la actualización', async () => {
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: configBase, error: null }))
      .mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'update error' } }))
    await expect(notificationConfigService.upsert(7)).rejects.toThrow('update error')
  })
})
