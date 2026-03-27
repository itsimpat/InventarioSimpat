import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: { database: { from: vi.fn() } },
}))

import { insforge } from '../lib/insforge'
import { iyBudgetService } from './iyBudgetService'

const mockFrom = vi.mocked(insforge.database.from)

const budgetBase = {
  id: 'b1',
  colaborador_id: 'c1',
  monto_total: 1000,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

beforeEach(() => vi.clearAllMocks())

describe('iyBudgetService.getByCollaboratorId', () => {
  it('retorna el presupuesto cuando existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: budgetBase, error: null }))
    const result = await iyBudgetService.getByCollaboratorId('c1')
    expect(result).toEqual(budgetBase)
  })

  it('retorna null cuando no existe (not found)', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'not found' } }))
    const result = await iyBudgetService.getByCollaboratorId('c1')
    expect(result).toBeNull()
  })

  it('retorna null cuando no existe (no rows)', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'no rows' } }))
    const result = await iyBudgetService.getByCollaboratorId('c1')
    expect(result).toBeNull()
  })

  it('lanza error para errores que no son "not found"', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'connection error' } }))
    await expect(iyBudgetService.getByCollaboratorId('c1')).rejects.toThrow('connection error')
  })

  it('retorna null cuando data es null sin error DB', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    const result = await iyBudgetService.getByCollaboratorId('c1')
    expect(result).toBeNull()
  })
})

describe('iyBudgetService.upsert', () => {
  it('actualiza el presupuesto cuando ya existe', async () => {
    const updated = { ...budgetBase, monto_total: 1500 }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: budgetBase, error: null }))   // get
      .mockReturnValueOnce(makeBuilder({ data: updated, error: null }))      // update
    const result = await iyBudgetService.upsert('c1', 1500)
    expect(result.monto_total).toBe(1500)
  })

  it('crea el presupuesto cuando no existe', async () => {
    const created = { ...budgetBase, monto_total: 2000 }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'not found' } }))  // get → null
      .mockReturnValueOnce(makeBuilder({ data: created, error: null }))                   // insert
    const result = await iyBudgetService.upsert('c1', 2000)
    expect(result.monto_total).toBe(2000)
    expect(result.colaborador_id).toBe('c1')
  })

  it('lanza error cuando falla la actualización', async () => {
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: budgetBase, error: null }))
      .mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'update error' } }))
    await expect(iyBudgetService.upsert('c1', 1000)).rejects.toThrow('update error')
  })

  it('lanza error cuando falla la inserción', async () => {
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'not found' } }))
      .mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'insert error' } }))
    await expect(iyBudgetService.upsert('c1', 1000)).rejects.toThrow('insert error')
  })
})
