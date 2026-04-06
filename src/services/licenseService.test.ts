import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: { database: { from: vi.fn() } },
}))
vi.mock('../utils/banxico', () => ({
  fetchExchangeRate: vi.fn().mockResolvedValue(17),
}))

import { insforge } from '../lib/insforge'
import { licenseService } from './licenseService'

const mockFrom = vi.mocked(insforge.database.from)

const licBase = {
  id: 'l1',
  nombre_producto: 'GitHub Copilot',
  tipo: 'Monthly' as const,
  costo_mxn: 340,
  costo_usd: 20,
  fecha_renovacion: '2025-04-15',
  colaborador_id: 'c1',
  categoria: 'IY' as const,
  activa: true,
  created_at: '2024-04-15',
  updated_at: '2024-04-15',
}

beforeEach(() => vi.clearAllMocks())

describe('licenseService.getAll', () => {
  it('retorna todas las licencias sin filtros', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [licBase], error: null }))
    const result = await licenseService.getAll()
    expect(result).toEqual([licBase])
  })

  it('aplica filtro de colaborador', async () => {
    const builder = makeBuilder({ data: [licBase], error: null })
    mockFrom.mockReturnValue(builder)
    await licenseService.getAll({ collaboratorId: 'c1' })
    expect(builder.eq).toHaveBeenCalledWith('colaborador_id', 'c1')
  })

  it('aplica filtro de tipo', async () => {
    const builder = makeBuilder({ data: [licBase], error: null })
    mockFrom.mockReturnValue(builder)
    await licenseService.getAll({ tipo: 'Monthly' })
    expect(builder.eq).toHaveBeenCalledWith('tipo', 'Monthly')
  })

  it('aplica filtro de categoria', async () => {
    const builder = makeBuilder({ data: [licBase], error: null })
    mockFrom.mockReturnValue(builder)
    await licenseService.getAll({ categoria: 'IY' })
    expect(builder.eq).toHaveBeenCalledWith('categoria', 'IY')
  })

  it('aplica filtro de activa', async () => {
    const builder = makeBuilder({ data: [licBase], error: null })
    mockFrom.mockReturnValue(builder)
    await licenseService.getAll({ activa: true })
    expect(builder.eq).toHaveBeenCalledWith('activa', true)
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'DB error' } }))
    await expect(licenseService.getAll()).rejects.toThrow('DB error')
  })
})

describe('licenseService.getById', () => {
  it('retorna la licencia cuando existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: licBase, error: null }))
    const result = await licenseService.getById('l1')
    expect(result).toEqual(licBase)
  })

  it('lanza error cuando no existe', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'not found' } }))
    await expect(licenseService.getById('missing')).rejects.toThrow('not found')
  })

  it('lanza error cuando data es null sin error DB', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    await expect(licenseService.getById('l1')).rejects.toThrow('l1')
  })
})

describe('licenseService.getByCollaborator', () => {
  it('delega a getAll con collaboratorId', async () => {
    const builder = makeBuilder({ data: [licBase], error: null })
    mockFrom.mockReturnValue(builder)
    const result = await licenseService.getByCollaborator('c1')
    expect(result).toEqual([licBase])
    expect(builder.eq).toHaveBeenCalledWith('colaborador_id', 'c1')
  })
})

describe('licenseService.getIYLicenses', () => {
  it('consulta por colaborador_id, categoria IY y activa true', async () => {
    const builder = makeBuilder({ data: [licBase], error: null })
    mockFrom.mockReturnValue(builder)
    const result = await licenseService.getIYLicenses('c1')
    expect(result).toEqual([licBase])
    expect(builder.eq).toHaveBeenCalledWith('colaborador_id', 'c1')
    expect(builder.eq).toHaveBeenCalledWith('categoria', 'IY')
    expect(builder.eq).toHaveBeenCalledWith('activa', true)
  })
})

describe('licenseService.getExpiringSoon', () => {
  it('consulta licencias activas en el rango de días', async () => {
    const builder = makeBuilder({ data: [licBase], error: null })
    mockFrom.mockReturnValue(builder)
    const result = await licenseService.getExpiringSoon(7)
    expect(result).toEqual([licBase])
    expect(builder.eq).toHaveBeenCalledWith('activa', true)
    expect(builder.gte).toHaveBeenCalled()
    expect(builder.lte).toHaveBeenCalled()
  })
})

describe('licenseService.create', () => {
  it('calcula costo_usd con Banxico al crear', async () => {
    const created = { ...licBase, costo_usd: 340 / 17 }
    mockFrom.mockReturnValue(makeBuilder({ data: created, error: null }))
    const { id: _id, created_at: _c, updated_at: _u, costo_usd: _usd, ...payload } = licBase
    const result = await licenseService.create(payload)
    expect(result.costo_usd).toBeCloseTo(20)
  })

  it('lanza error cuando InsForge falla al crear', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'insert error' } }))
    const { id: _id, created_at: _c, updated_at: _u, costo_usd: _usd, ...payload } = licBase
    await expect(licenseService.create(payload)).rejects.toThrow('insert error')
  })
})

describe('licenseService.deactivate', () => {
  it('desactiva la licencia sin retornar datos', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    await expect(licenseService.deactivate('l1')).resolves.toBeUndefined()
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'update error' } }))
    await expect(licenseService.deactivate('l1')).rejects.toThrow('update error')
  })
})

describe('licenseService.reassign', () => {
  it('actualiza colaborador_id de la licencia', async () => {
    const reassigned = { ...licBase, colaborador_id: 'c2' }
    mockFrom.mockReturnValue(makeBuilder({ data: reassigned, error: null }))
    const result = await licenseService.reassign('l1', 'c2')
    expect(result.colaborador_id).toBe('c2')
  })
})
