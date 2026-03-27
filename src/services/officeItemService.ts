import { insforge } from '../lib/insforge'
import { fetchExchangeRate } from '../utils/banxico'
import { convertMXNtoUSD } from '../utils/currency'
import type { OfficeItem, OfficeItemCategory } from '../types'

type OfficeItemFilters = {
  categoria?: OfficeItemCategory
}

export const officeItemService = {
  async getAll(filters?: OfficeItemFilters): Promise<OfficeItem[]> {
    let query = insforge.database.from('office_items').select()

    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as OfficeItem[]
  },

  async getById(id: string): Promise<OfficeItem> {
    const { data, error } = await insforge.database
      .from('office_items')
      .select()
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error(`Artículo de oficina ${id} no encontrado`)
    return data as OfficeItem
  },

  async create(data: Omit<OfficeItem, 'id' | 'created_at' | 'updated_at' | 'costo_usd'>): Promise<OfficeItem> {
    const rate = await fetchExchangeRate()
    const costo_usd = convertMXNtoUSD(data.costo_mxn, rate)

    const { data: created, error } = await insforge.database
      .from('office_items')
      .insert({ ...data, costo_usd })
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!created) throw new Error('No se pudo crear el artículo de oficina')
    return created as OfficeItem
  },

  async update(id: string, data: Partial<OfficeItem>): Promise<OfficeItem> {
    const { data: updated, error } = await insforge.database
      .from('office_items')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!updated) throw new Error('No se pudo actualizar el artículo de oficina')
    return updated as OfficeItem
  },

  async updateQuantity(id: string, quantity: number): Promise<OfficeItem> {
    return officeItemService.update(id, { cantidad: quantity })
  },
}
