import { insforge } from '../lib/insforge'
import type { Collaborator } from '../types'

type CollaboratorFilters = {
  search?: string
  area?: string
  activo?: boolean
}

export const collaboratorService = {
  async getAll(filters?: CollaboratorFilters): Promise<Collaborator[]> {
    let query = insforge.database.from('collaborators').select()

    if (filters?.activo !== undefined) {
      query = query.eq('activo', filters.activo)
    }
    if (filters?.area) {
      query = query.eq('area', filters.area)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    let result = (data ?? []) as Collaborator[]

    if (filters?.search) {
      const term = filters.search.toLowerCase()
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term)
      )
    }

    return result
  },

  async getById(id: string): Promise<Collaborator> {
    const { data, error } = await insforge.database
      .from('collaborators')
      .select()
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error(`Collaborator ${id} not found`)
    return data as Collaborator
  },

  async create(data: Omit<Collaborator, 'id' | 'created_at' | 'updated_at'>): Promise<Collaborator> {
    const { data: created, error } = await insforge.database
      .from('collaborators')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!created) throw new Error('Failed to create collaborator')
    return created as Collaborator
  },

  async update(id: string, data: Partial<Collaborator>): Promise<Collaborator> {
    const { data: updated, error } = await insforge.database
      .from('collaborators')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('Failed to update collaborator')
    return updated as Collaborator
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await insforge.database
      .from('collaborators')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
