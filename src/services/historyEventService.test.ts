import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: { database: { from: vi.fn() } },
}))

import { insforge } from '../lib/insforge'
import { historyEventService } from './historyEventService'

const mockFrom = vi.mocked(insforge.database.from)

const eventBase = {
  id: 'h1',
  entidad_tipo: 'Equipment' as const,
  entidad_id: 'e1',
  tipo_evento: 'Reasignación' as const,
  descripcion: 'Equipo asignado',
  fecha_inicio: '2025-01-15T10:00:00Z',
  fecha_fin: null,
  tecnico_nombre: null,
  tecnico_telefono: null,
  costo_mxn: null,
  costo_usd: null,
  colaborador_anterior_id: null,
  colaborador_nuevo_id: 'c1',
  registrado_por: 'admin@simpat.com',
  created_at: '2025-01-15T10:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('historyEventService.getByEntity', () => {
  it('retorna eventos de una entidad', async () => {
    const builder = makeBuilder({ data: [eventBase], error: null })
    mockFrom.mockReturnValue(builder)
    const result = await historyEventService.getByEntity('Equipment', 'e1')
    expect(result).toEqual([eventBase])
    expect(builder.eq).toHaveBeenCalledWith('entidad_tipo', 'Equipment')
    expect(builder.eq).toHaveBeenCalledWith('entidad_id', 'e1')
    expect(builder.order).toHaveBeenCalledWith('fecha_inicio', { ascending: false })
  })

  it('retorna arreglo vacío cuando no hay eventos', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    const result = await historyEventService.getByEntity('Peripheral', 'p1')
    expect(result).toEqual([])
  })

  it('lanza error cuando InsForge falla', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'DB error' } }))
    await expect(historyEventService.getByEntity('Equipment', 'e1')).rejects.toThrow('DB error')
  })
})

describe('historyEventService.create', () => {
  it('crea y retorna el evento de historial', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: eventBase, error: null }))
    const { id: _id, created_at: _c, ...payload } = eventBase
    const result = await historyEventService.create(payload)
    expect(result).toEqual(eventBase)
  })

  it('lanza error cuando InsForge falla al insertar', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: { message: 'insert error' } }))
    const { id: _id, created_at: _c, ...payload } = eventBase
    await expect(historyEventService.create(payload)).rejects.toThrow('insert error')
  })

  it('lanza error cuando data es null sin error DB', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: null }))
    const { id: _id, created_at: _c, ...payload } = eventBase
    await expect(historyEventService.create(payload)).rejects.toThrow('crear el evento')
  })
})
