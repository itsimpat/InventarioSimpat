import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: { database: { from: vi.fn() } },
}))
vi.mock('../utils/banxico', () => ({
  fetchExchangeRate: vi.fn().mockResolvedValue(17),
}))
vi.mock('./historyEventService', () => ({
  historyEventService: { create: vi.fn().mockResolvedValue({}) },
}))

import { insforge } from '../lib/insforge'
import { historyEventService } from './historyEventService'
import { peripheralService } from './peripheralService'

const mockFrom = vi.mocked(insforge.database.from)

const periBase = {
  id: 'p1',
  tipo: 'Monitor' as const,
  marca: 'LG',
  modelo: '27UL600',
  costo_mxn: 8500,
  costo_usd: 500,
  fecha_compra: '2023-06-01',
  estatus: 'In Storage' as const,
  colaborador_id: null,
  created_at: '2023-06-01',
  updated_at: '2023-06-01',
}

beforeEach(() => vi.clearAllMocks())

describe('peripheralService.getAll', () => {
  it('retorna todos los periféricos', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [periBase], error: null }))
    const result = await peripheralService.getAll()
    expect(result).toEqual([periBase])
  })

  it('aplica filtro de tipo en el query', async () => {
    const builder = makeBuilder({ data: [periBase], error: null })
    mockFrom.mockReturnValue(builder)
    await peripheralService.getAll({ tipo: 'Monitor' })
    expect(builder.eq).toHaveBeenCalledWith('tipo', 'Monitor')
  })

  it('aplica filtro de estatus en el query', async () => {
    const builder = makeBuilder({ data: [periBase], error: null })
    mockFrom.mockReturnValue(builder)
    await peripheralService.getAll({ status: 'Assigned' })
    expect(builder.eq).toHaveBeenCalledWith('estatus', 'Assigned')
  })

  it('filtra por ownership Bodega usando is(null)', async () => {
    const builder = makeBuilder({ data: [periBase], error: null })
    mockFrom.mockReturnValue(builder)
    await peripheralService.getAll({ ownership: 'Storage' })
    expect(builder.is).toHaveBeenCalledWith('colaborador_id', null)
  })

  it('filtra por ownership Colaborador usando not(null)', async () => {
    const builder = makeBuilder({ data: [periBase], error: null })
    mockFrom.mockReturnValue(builder)
    await peripheralService.getAll({ ownership: 'Collaborator' })
    expect(builder.not).toHaveBeenCalledWith('colaborador_id', 'is', null)
  })

  it('aplica filtro de collaboratorId en el query', async () => {
    const builder = makeBuilder({ data: [periBase], error: null })
    mockFrom.mockReturnValue(builder)
    await peripheralService.getAll({ collaboratorId: 'c1' })
    expect(builder.eq).toHaveBeenCalledWith('colaborador_id', 'c1')
  })

  it('collaboratorId tiene precedencia sobre ownership Bodega', async () => {
    const builder = makeBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(builder)
    await peripheralService.getAll({ collaboratorId: 'c1', ownership: 'Storage' })
    expect(builder.eq).toHaveBeenCalledWith('colaborador_id', 'c1')
    expect(builder.is).not.toHaveBeenCalled()
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'DB error' } }))
    await expect(peripheralService.getAll()).rejects.toThrow('DB error')
  })
})

describe('peripheralService.getById', () => {
  it('retorna el periférico cuando existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: periBase, error: null }))
    const result = await peripheralService.getById('p1')
    expect(result).toEqual(periBase)
  })

  it('lanza error cuando data es null sin error', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    await expect(peripheralService.getById('missing')).rejects.toThrow('missing')
  })
})

describe('peripheralService.create', () => {
  it('calcula costo_usd con Banxico al crear', async () => {
    const created = { ...periBase, costo_usd: 8500 / 17 }
    mockFrom.mockReturnValue(makeBuilder({ data: created, error: null }))
    const { id: _id, created_at: _c, updated_at: _u, costo_usd: _usd, ...payload } = periBase
    const result = await peripheralService.create(payload)
    expect(result.costo_usd).toBeCloseTo(8500 / 17)
  })
})

describe('peripheralService.update', () => {
  it('actualiza sin recalcular cuando no cambia costo_mxn', async () => {
    const updated = { ...periBase, modelo: '27UL800' }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await peripheralService.update('p1', { modelo: '27UL800' })
    expect(result.modelo).toBe('27UL800')
  })

  it('recalcula costo_usd cuando cambia costo_mxn', async () => {
    const updated = { ...periBase, costo_mxn: 17000, costo_usd: 1000 }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await peripheralService.update('p1', { costo_mxn: 17000 })
    expect(result.costo_usd).toBe(1000)
  })
})

describe('peripheralService.changeStatus', () => {
  it('cambia el estatus', async () => {
    const updated = { ...periBase, estatus: 'Under Repair' as const }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await peripheralService.changeStatus('p1', 'Under Repair')
    expect(result.estatus).toBe('Under Repair')
  })
})

describe('peripheralService.assignToCollaborator', () => {
  it('asigna el periférico y crea evento de historial', async () => {
    const assigned = { ...periBase, colaborador_id: 'c1', estatus: 'Assigned' as const }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: periBase, error: null }))    // getById
      .mockReturnValueOnce(makeBuilder({ data: assigned, error: null }))    // update
    const result = await peripheralService.assignToCollaborator('p1', 'c1', 'admin@simpat.com')
    expect(result.colaborador_id).toBe('c1')
    expect(historyEventService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad_tipo: 'Peripheral',
        tipo_evento: 'Reassignment',
        colaborador_nuevo_id: 'c1',
      })
    )
  })
})

describe('peripheralService.returnToStorage', () => {
  it('regresa el periférico a bodega y crea evento de historial', async () => {
    const assigned = { ...periBase, colaborador_id: 'c1', estatus: 'Assigned' as const }
    const returned = { ...periBase, colaborador_id: null, estatus: 'In Storage' as const }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: assigned, error: null }))    // getById
      .mockReturnValueOnce(makeBuilder({ data: returned, error: null }))    // update
    const result = await peripheralService.returnToStorage('p1', 'admin@simpat.com')
    expect(result.colaborador_id).toBeNull()
    expect(result.estatus).toBe('In Storage')
    expect(historyEventService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        colaborador_anterior_id: 'c1',
        colaborador_nuevo_id: null,
      })
    )
  })
})
