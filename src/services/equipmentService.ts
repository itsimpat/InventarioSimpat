import { insforge } from '../lib/insforge'
import type { Equipment, EquipmentStatus } from '../types'
import { fetchExchangeRate } from '../utils/banxico'
import { convertMXNtoUSD } from '../utils/currency'
import { historyEventService } from './historyEventService'

type EquipmentFilters = {
  status?: EquipmentStatus
  collaboratorId?: string
  brand?: string
}

export const equipmentService = {
  async getAll(filters?: EquipmentFilters): Promise<Equipment[]> {
    let query = insforge.database.from('equipment').select()

    if (filters?.status) {
      query = query.eq('estatus', filters.status)
    }
    if (filters?.collaboratorId) {
      query = query.eq('colaborador_id', filters.collaboratorId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    let result = (data ?? []) as Equipment[]

    if (filters?.brand) {
      const term = filters.brand.toLowerCase()
      result = result.filter(
        (e) =>
          e.marca.toLowerCase().includes(term) ||
          e.modelo.toLowerCase().includes(term)
      )
    }

    return result
  },

  async getById(id: string): Promise<Equipment> {
    const { data, error } = await insforge.database
      .from('equipment')
      .select()
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error(`Equipo ${id} no encontrado`)
    return data as Equipment
  },

  async create(data: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): Promise<Equipment> {
    const rate = await fetchExchangeRate()
    const costo_usd = convertMXNtoUSD(data.costo_mxn, rate)

    const { data: created, error } = await insforge.database
      .from('equipment')
      .insert({ ...data, costo_usd })
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!created) throw new Error('No se pudo crear el equipo')
    return created as Equipment
  },

  async update(id: string, data: Partial<Equipment>): Promise<Equipment> {
    const updateData = { ...data }

    if (data.costo_mxn !== undefined) {
      const rate = await fetchExchangeRate()
      updateData.costo_usd = convertMXNtoUSD(data.costo_mxn, rate)
    }

    const { data: updated, error } = await insforge.database
      .from('equipment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo actualizar el equipo')
    return updated as Equipment
  },

  async changeStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
    const { data: updated, error } = await insforge.database
      .from('equipment')
      .update({ estatus: status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo cambiar el estatus')
    return updated as Equipment
  },

  async assign(
    equipmentId: string,
    collaboratorId: string,
    registradoPor: string
  ): Promise<Equipment> {
    const current = await this.getById(equipmentId)
    const colaboradorAnteriorId = current.colaborador_id

    const { data: updated, error } = await insforge.database
      .from('equipment')
      .update({ colaborador_id: collaboratorId, estatus: 'Asignado' as EquipmentStatus })
      .eq('id', equipmentId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo asignar el equipo')

    await historyEventService.create({
      entidad_tipo: 'Equipment',
      entidad_id: equipmentId,
      tipo_evento: 'Reasignación',
      descripcion: 'Equipo asignado a colaborador',
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

    return updated as Equipment
  },

  async unassign(equipmentId: string, registradoPor: string): Promise<Equipment> {
    const current = await this.getById(equipmentId)
    const colaboradorAnteriorId = current.colaborador_id

    const { data: updated, error } = await insforge.database
      .from('equipment')
      .update({ colaborador_id: null, estatus: 'En Bodega' as EquipmentStatus })
      .eq('id', equipmentId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo desasignar el equipo')

    await historyEventService.create({
      entidad_tipo: 'Equipment',
      entidad_id: equipmentId,
      tipo_evento: 'Reasignación',
      descripcion: 'Equipo regresado a bodega',
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

    return updated as Equipment
  },
}
