import { insforge } from '../lib/insforge'
import { fetchExchangeRate } from '../utils/banxico'
import { convertUSDtoMXN } from '../utils/currency'
import type { License, LicenseCategory, LicenseType } from '../types'

type LicenseFilters = {
  collaboratorId?: string
  tipo?: LicenseType
  categoria?: LicenseCategory
  activa?: boolean
}

export const licenseService = {
  async getAll(filters?: LicenseFilters): Promise<License[]> {
    let query = insforge.database.from('licenses').select()

    if (filters?.collaboratorId) {
      query = query.eq('colaborador_id', filters.collaboratorId)
    }
    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo)
    }
    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria)
    }
    if (filters?.activa !== undefined) {
      query = query.eq('activa', filters.activa)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as License[]
  },

  async getById(id: string): Promise<License> {
    const { data, error } = await insforge.database
      .from('licenses')
      .select()
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error(`Licencia ${id} no encontrada`)
    return data as License
  },

  async getByCollaborator(collaboratorId: string): Promise<License[]> {
    return licenseService.getAll({ collaboratorId })
  },

  async getIYLicenses(collaboratorId: string): Promise<License[]> {
    const { data, error } = await insforge.database
      .from('licenses')
      .select()
      .eq('colaborador_id', collaboratorId)
      .eq('categoria', 'IY')
      .eq('activa', true)

    if (error) throw new Error(error.message)
    return (data ?? []) as License[]
  },

  async getExpiringSoon(daysAhead: number): Promise<License[]> {
    const now = new Date()
    const future = new Date()
    future.setDate(now.getDate() + daysAhead)

    const todayStr = now.toISOString().substring(0, 10)
    const futureStr = future.toISOString().substring(0, 10)

    const { data, error } = await insforge.database
      .from('licenses')
      .select()
      .eq('activa', true)
      .gte('fecha_renovacion', todayStr)
      .lte('fecha_renovacion', futureStr)

    if (error) throw new Error(error.message)
    return (data ?? []) as License[]
  },

  async create(data: Omit<License, 'id' | 'created_at' | 'updated_at' | 'costo_mxn'>): Promise<License> {
    const rate = await fetchExchangeRate()
    const costo_mxn = convertUSDtoMXN(data.costo_usd, rate)

    const { data: created, error } = await insforge.database
      .from('licenses')
      .insert({ ...data, costo_mxn })
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!created) throw new Error('No se pudo crear la licencia')
    return created as License
  },

  async update(id: string, data: Partial<License>): Promise<License> {
    const { data: updated, error } = await insforge.database
      .from('licenses')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo actualizar la licencia')
    return updated as License
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('licenses')
      .update({ activa: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async reassign(licenseId: string, newCollaboratorId: string): Promise<License> {
    return licenseService.update(licenseId, { colaborador_id: newCollaboratorId })
  },
}
