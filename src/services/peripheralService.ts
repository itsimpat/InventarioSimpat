import { insforge } from '../lib/insforge'
import type { Peripheral, EquipmentStatus } from '../types'
import { fetchExchangeRate } from '../utils/banxico'
import { convertMXNtoUSD } from '../utils/currency'
import { historyEventService } from './historyEventService'

type PeripheralFilters = {
  tipo?: string
  status?: string
  ownership?: 'Bodega' | 'Colaborador'
  collaboratorId?: string
}

export const peripheralService = {
  async getAll(filters?: PeripheralFilters): Promise<Peripheral[]> {
    let query = insforge.database.from('peripherals').select()

    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo)
    }
    if (filters?.status) {
      query = query.eq('estatus', filters.status)
    }
    if (filters?.collaboratorId) {
      query = query.eq('colaborador_id', filters.collaboratorId)
    } else if (filters?.ownership === 'Bodega') {
      query = query.is('colaborador_id', null)
    } else if (filters?.ownership === 'Colaborador') {
      query = query.not('colaborador_id', 'is', null)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as Peripheral[]
  },

  async getById(id: string): Promise<Peripheral> {
    const { data, error } = await insforge.database
      .from('peripherals')
      .select()
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error(`Periférico ${id} no encontrado`)
    return data as Peripheral
  },

  async create(data: Omit<Peripheral, 'id' | 'created_at' | 'updated_at' | 'costo_usd'>): Promise<Peripheral> {
    const rate = await fetchExchangeRate()
    const costo_usd = convertMXNtoUSD(data.costo_mxn, rate)

    const { data: created, error } = await insforge.database
      .from('peripherals')
      .insert({ ...data, costo_usd })
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!created) throw new Error('No se pudo crear el periférico')
    return created as Peripheral
  },

  async update(id: string, data: Partial<Peripheral>): Promise<Peripheral> {
    const updateData = { ...data }

    if (data.costo_mxn !== undefined) {
      const rate = await fetchExchangeRate()
      updateData.costo_usd = convertMXNtoUSD(data.costo_mxn, rate)
    }

    const { data: updated, error } = await insforge.database
      .from('peripherals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo actualizar el periférico')
    return updated as Peripheral
  },

  async changeStatus(id: string, status: string): Promise<Peripheral> {
    const { data: updated, error } = await insforge.database
      .from('peripherals')
      .update({ estatus: status as EquipmentStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo cambiar el estatus')
    return updated as Peripheral
  },

  async assignToCollaborator(
    peripheralId: string,
    collaboratorId: string,
    registradoPor: string
  ): Promise<Peripheral> {
    const current = await this.getById(peripheralId)
    const colaboradorAnteriorId = current.colaborador_id

    const { data: updated, error } = await insforge.database
      .from('peripherals')
      .update({ colaborador_id: collaboratorId, estatus: 'Asignado' as EquipmentStatus })
      .eq('id', peripheralId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo asignar el periférico')

    await historyEventService.create({
      entidad_tipo: 'Peripheral',
      entidad_id: peripheralId,
      tipo_evento: 'Reasignación',
      descripcion: 'Periférico asignado a colaborador',
      fecha_inicio: new Date().toISOString(),
      fecha_fin: null,
      tecnico_nombre: null,
      tecnico_telefono: null,
      costo_mxn: null,
      costo_usd: null,
      colaborador_anterior_id: colaboradorAnteriorId,
      colaborador_nuevo_id: collaboratorId,
      registrado_por: registradoPor,
    })

    return updated as Peripheral
  },

  async returnToBodega(peripheralId: string, registradoPor: string): Promise<Peripheral> {
    const current = await this.getById(peripheralId)
    const colaboradorAnteriorId = current.colaborador_id

    const { data: updated, error } = await insforge.database
      .from('peripherals')
      .update({ colaborador_id: null, estatus: 'En Bodega' as EquipmentStatus })
      .eq('id', peripheralId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo regresar a bodega')

    await historyEventService.create({
      entidad_tipo: 'Peripheral',
      entidad_id: peripheralId,
      tipo_evento: 'Reasignación',
      descripcion: 'Periférico regresado a bodega',
      fecha_inicio: new Date().toISOString(),
      fecha_fin: null,
      tecnico_nombre: null,
      tecnico_telefono: null,
      costo_mxn: null,
      costo_usd: null,
      colaborador_anterior_id: colaboradorAnteriorId,
      colaborador_nuevo_id: null,
      registrado_por: registradoPor,
    })

    return updated as Peripheral
  },
}
