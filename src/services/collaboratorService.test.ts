import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: {
    database: { from: vi.fn() },
  },
}))

import { insforge } from '../lib/insforge'
import { collaboratorService } from './collaboratorService'

const mockFrom = vi.mocked(insforge.database.from)

const colabBase = {
  id: 'c1',
  nombre: 'Ana García',
  area: 'Desarrollo',
  puesto: 'Dev',
  email: 'ana@simpat.com',
  activo: true,
  fecha_ingreso: '2023-01-01',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
}

beforeEach(() => vi.clearAllMocks())

describe('collaboratorService.getAll', () => {
  it('retorna todos los colaboradores sin filtros', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [colabBase], error: null }))
    const result = await collaboratorService.getAll()
    expect(result).toEqual([colabBase])
  })

  it('filtra por búsqueda de texto en nombre', async () => {
    const colab2 = { ...colabBase, id: 'c2', nombre: 'Luis Pérez', email: 'luis@simpat.com' }
    mockFrom.mockReturnValue(makeBuilder({ data: [colabBase, colab2], error: null }))
    const result = await collaboratorService.getAll({ search: 'ana' })
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Ana García')
  })

  it('filtra por búsqueda de texto en email', async () => {
    const colab2 = { ...colabBase, id: 'c2', nombre: 'Luis', email: 'luis@simpat.com' }
    mockFrom.mockReturnValue(makeBuilder({ data: [colabBase, colab2], error: null }))
    const result = await collaboratorService.getAll({ search: 'luis@' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c2')
  })

  it('llama a eq cuando se filtra por activo', async () => {
    const builder = makeBuilder({ data: [colabBase], error: null })
    mockFrom.mockReturnValue(builder)
    await collaboratorService.getAll({ activo: true })
    expect(builder.eq).toHaveBeenCalledWith('activo', true)
  })

  it('llama a eq cuando se filtra por area', async () => {
    const builder = makeBuilder({ data: [colabBase], error: null })
    mockFrom.mockReturnValue(builder)
    await collaboratorService.getAll({ area: 'Desarrollo' })
    expect(builder.eq).toHaveBeenCalledWith('area', 'Desarrollo')
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'DB error' } }))
    await expect(collaboratorService.getAll()).rejects.toThrow('DB error')
  })
})

describe('collaboratorService.getById', () => {
  it('retorna el colaborador cuando existe', async () => {
    const builder = makeBuilder({ data: colabBase, error: null })
    mockFrom.mockReturnValue(builder)
    const result = await collaboratorService.getById('c1')
    expect(result).toEqual(colabBase)
    expect(builder.single).toHaveBeenCalled()
  })

  it('lanza error cuando no se encuentra', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'not found' } }))
    await expect(collaboratorService.getById('missing')).rejects.toThrow('not found')
  })

  it('lanza error cuando data es null sin error de DB', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    await expect(collaboratorService.getById('c1')).rejects.toThrow('c1')
  })
})

describe('collaboratorService.create', () => {
  it('crea y retorna el colaborador', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: colabBase, error: null }))
    const { id: _id, created_at: _c, updated_at: _u, ...payload } = colabBase
    const result = await collaboratorService.create(payload)
    expect(result).toEqual(colabBase)
  })

  it('lanza error cuando InsForge falla al crear', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'insert error' } }))
    const { id: _id, created_at: _c, updated_at: _u, ...payload } = colabBase
    await expect(collaboratorService.create(payload)).rejects.toThrow('insert error')
  })
})

describe('collaboratorService.update', () => {
  it('actualiza y retorna el colaborador', async () => {
    const updated = { ...colabBase, puesto: 'Senior Dev' }
    mockFrom.mockReturnValue(makeBuilder({ data: updated, error: null }))
    const result = await collaboratorService.update('c1', { puesto: 'Senior Dev' })
    expect(result.puesto).toBe('Senior Dev')
  })
})

describe('collaboratorService.deactivate', () => {
  it('desactiva sin retornar datos', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    await expect(collaboratorService.deactivate('c1')).resolves.toBeUndefined()
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'update error' } }))
    await expect(collaboratorService.deactivate('c1')).rejects.toThrow('update error')
  })
})
