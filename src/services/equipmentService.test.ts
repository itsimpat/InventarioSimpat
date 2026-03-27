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
import { equipmentService } from './equipmentService'

const mockFrom = vi.mocked(insforge.database.from)

const equipBase = {
  id: 'e1',
  marca: 'Apple',
  modelo: 'MacBook Pro',
  anio_compra: 2023,
  costo_mxn: 40000,
  costo_usd: 2352.94,
  especificaciones: { ram: '16GB' },
  estatus: 'En Bodega' as const,
  colaborador_id: null,
  fecha_compra: '2023-01-15',
  created_at: '2023-01-15',
  updated_at: '2023-01-15',
}

beforeEach(() => vi.clearAllMocks())

describe('equipmentService.getAll', () => {
  it('retorna todos los equipos sin filtros', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [equipBase], error: null }))
    const result = await equipmentService.getAll()
    expect(result).toEqual([equipBase])
  })

  it('filtra por marca en cliente', async () => {
    const equip2 = { ...equipBase, id: 'e2', marca: 'Dell', modelo: 'XPS' }
    mockFrom.mockReturnValue(makeBuilder({ data: [equipBase, equip2], error: null }))
    const result = await equipmentService.getAll({ brand: 'apple' })
    expect(result).toHaveLength(1)
    expect(result[0].marca).toBe('Apple')
  })

  it('filtra por modelo en cliente', async () => {
    const equip2 = { ...equipBase, id: 'e2', marca: 'Dell', modelo: 'XPS 15' }
    mockFrom.mockReturnValue(makeBuilder({ data: [equipBase, equip2], error: null }))
    const result = await equipmentService.getAll({ brand: 'xps' })
    expect(result).toHaveLength(1)
    expect(result[0].modelo).toBe('XPS 15')
  })

  it('aplica filtro de estatus en el query', async () => {
    const builder = makeBuilder({ data: [equipBase], error: null })
    mockFrom.mockReturnValue(builder)
    await equipmentService.getAll({ status: 'En Bodega' })
    expect(builder.eq).toHaveBeenCalledWith('estatus', 'En Bodega')
  })

  it('aplica filtro de colaborador en el query', async () => {
    const builder = makeBuilder({ data: [], error: null })
    mockFrom.mockReturnValue(builder)
    await equipmentService.getAll({ collaboratorId: 'c1' })
    expect(builder.eq).toHaveBeenCalledWith('colaborador_id', 'c1')
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'DB error' } }))
    await expect(equipmentService.getAll()).rejects.toThrow('DB error')
  })
})

describe('equipmentService.getById', () => {
  it('retorna el equipo cuando existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: equipBase, error: null }))
    const result = await equipmentService.getById('e1')
    expect(result).toEqual(equipBase)
  })

  it('lanza error cuando no existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'not found' } }))
    await expect(equipmentService.getById('missing')).rejects.toThrow('not found')
  })
})

describe('equipmentService.create', () => {
  it('obtiene tipo de cambio y calcula costo_usd al crear', async () => {
    const created = { ...equipBase, costo_usd: 40000 / 17 }
    mockFrom.mockReturnValue(makeBuilder({ data: created, error: null }))

    const { id: _id, created_at: _c, updated_at: _u, costo_usd: _usd, ...payload } = equipBase
    const result = await equipmentService.create(payload)
    expect(result).toEqual(created)
  })

  it('lanza error cuando InsForge falla al crear', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'insert error' } }))
    const { id: _id, created_at: _c, updated_at: _u, costo_usd: _usd, ...payload } = equipBase
    await expect(equipmentService.create(payload)).rejects.toThrow('insert error')
  })
})

describe('equipmentService.update', () => {
  it('actualiza sin recalcular USD cuando no cambia costo_mxn', async () => {
    const updated = { ...equipBase, modelo: 'MacBook Air' }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await equipmentService.update('e1', { modelo: 'MacBook Air' })
    expect(result.modelo).toBe('MacBook Air')
  })

  it('recalcula costo_usd cuando cambia costo_mxn', async () => {
    const updated = { ...equipBase, costo_mxn: 34000, costo_usd: 34000 / 17 }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await equipmentService.update('e1', { costo_mxn: 34000 })
    expect(result.costo_usd).toBeCloseTo(2000)
  })
})

describe('equipmentService.changeStatus', () => {
  it('cambia el estatus del equipo', async () => {
    const updated = { ...equipBase, estatus: 'Asignado' as const }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await equipmentService.changeStatus('e1', 'Asignado')
    expect(result.estatus).toBe('Asignado')
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'update error' } }))
    await expect(equipmentService.changeStatus('e1', 'Vendido')).rejects.toThrow('update error')
  })
})

describe('equipmentService.assign', () => {
  it('asigna el equipo y crea evento en historial', async () => {
    const assigned = { ...equipBase, colaborador_id: 'c1', estatus: 'Asignado' as const }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: equipBase, error: null }))   // getById
      .mockReturnValueOnce(makeBuilder({ data: assigned, error: null }))    // update
    const result = await equipmentService.assign('e1', 'c1', 'admin@simpat.com')
    expect(result.colaborador_id).toBe('c1')
    expect(result.estatus).toBe('Asignado')
    expect(historyEventService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad_tipo: 'Equipment',
        tipo_evento: 'Reasignación',
        colaborador_nuevo_id: 'c1',
      })
    )
  })
})

describe('equipmentService.unassign', () => {
  it('desasigna el equipo y lo regresa a bodega', async () => {
    const equip = { ...equipBase, colaborador_id: 'c1', estatus: 'Asignado' as const }
    const unassigned = { ...equipBase, colaborador_id: null, estatus: 'En Bodega' as const }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: equip, error: null }))       // getById
      .mockReturnValueOnce(makeBuilder({ data: unassigned, error: null }))  // update
    const result = await equipmentService.unassign('e1', 'admin@simpat.com')
    expect(result.colaborador_id).toBeNull()
    expect(result.estatus).toBe('En Bodega')
    expect(historyEventService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_evento: 'Reasignación',
        colaborador_nuevo_id: null,
        colaborador_anterior_id: 'c1',
      })
    )
  })
})
