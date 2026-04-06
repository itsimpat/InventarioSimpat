import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: { database: { from: vi.fn() } },
}))
vi.mock('../utils/banxico', () => ({
  fetchExchangeRate: vi.fn().mockResolvedValue(17),
}))

import { insforge } from '../lib/insforge'
import { officeItemService } from './officeItemService'

const mockFrom = vi.mocked(insforge.database.from)

const itemBase = {
  id: 'o1',
  nombre: 'Silla ergonómica',
  categoria: 'Chair' as const,
  marca: 'Herman Miller',
  costo_mxn: 15000,
  costo_usd: 882.35,
  fecha_compra: '2023-03-01',
  cantidad: 10,
  created_at: '2023-03-01',
  updated_at: '2023-03-01',
}

beforeEach(() => vi.clearAllMocks())

describe('officeItemService.getAll', () => {
  it('retorna todos los artículos sin filtros', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [itemBase], error: null }))
    const result = await officeItemService.getAll()
    expect(result).toEqual([itemBase])
  })

  it('aplica filtro de categoría en el query', async () => {
    const builder = makeBuilder({ data: [itemBase], error: null })
    mockFrom.mockReturnValue(builder)
    await officeItemService.getAll({ categoria: 'Chair' })
    expect(builder.eq).toHaveBeenCalledWith('categoria', 'Chair')
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'DB error' } }))
    await expect(officeItemService.getAll()).rejects.toThrow('DB error')
  })
})

describe('officeItemService.getById', () => {
  it('retorna el artículo cuando existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: itemBase, error: null }))
    const result = await officeItemService.getById('o1')
    expect(result).toEqual(itemBase)
  })

  it('lanza error cuando no existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'not found' } }))
    await expect(officeItemService.getById('missing')).rejects.toThrow('not found')
  })

  it('lanza error cuando data es null sin error DB', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    await expect(officeItemService.getById('o1')).rejects.toThrow('o1')
  })
})

describe('officeItemService.create', () => {
  it('calcula costo_usd con Banxico al crear', async () => {
    const created = { ...itemBase, costo_usd: 15000 / 17 }
    mockFrom.mockReturnValue(makeBuilder({ data: created, error: null }))
    const { id: _id, created_at: _c, updated_at: _u, costo_usd: _usd, ...payload } = itemBase
    const result = await officeItemService.create(payload)
    expect(result.costo_usd).toBeCloseTo(15000 / 17)
  })

  it('lanza error cuando InsForge falla al crear', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'insert error' } }))
    const { id: _id, created_at: _c, updated_at: _u, costo_usd: _usd, ...payload } = itemBase
    await expect(officeItemService.create(payload)).rejects.toThrow('insert error')
  })
})

describe('officeItemService.update', () => {
  it('actualiza el artículo', async () => {
    const updated = { ...itemBase, nombre: 'Silla ejecutiva' }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await officeItemService.update('o1', { nombre: 'Silla ejecutiva' })
    expect(result.nombre).toBe('Silla ejecutiva')
  })

  it('lanza error cuando data es null', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    await expect(officeItemService.update('o1', { nombre: 'X' })).rejects.toThrow('actualizar')
  })
})

describe('officeItemService.updateQuantity', () => {
  it('llama a update con la nueva cantidad', async () => {
    const updated = { ...itemBase, cantidad: 15 }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await officeItemService.updateQuantity('o1', 15)
    expect(result.cantidad).toBe(15)
  })
})
