import { insforge } from '../lib/insforge'
import type { HistoryEvent, EntityType } from '../types'

export const historyEventService = {
  async getByEntity(tipo: EntityType, entityId: string): Promise<HistoryEvent[]> {
    const { data, error } = await insforge.database
      .from('history_events')
      .select()
      .eq('entidad_tipo', tipo)
      .eq('entidad_id', entityId)
      .order('fecha_inicio', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as HistoryEvent[]
  },

  async create(event: Omit<HistoryEvent, 'id' | 'created_at'>): Promise<HistoryEvent> {
    const { data, error } = await insforge.database
      .from('history_events')
      .insert(event)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('No se pudo crear el evento')
    return data as HistoryEvent
  },
}
