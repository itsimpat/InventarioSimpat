import { insforge } from '../lib/insforge'
import type { NotificationConfig } from '../types'

export const notificationConfigService = {
  async get(): Promise<NotificationConfig | null> {
    const { data, error } = await insforge.database
      .from('notification_config')
      .select()
      .single()

    if (error) {
      if (
        error.message?.toLowerCase().includes('not found') ||
        error.message?.toLowerCase().includes('no rows')
      ) {
        return null
      }
      throw new Error(error.message)
    }

    return data ? (data as NotificationConfig) : null
  },

  async upsert(diasAnticipacion: number): Promise<NotificationConfig> {
    const existing = await notificationConfigService.get()

    if (existing) {
      const { data, error } = await insforge.database
        .from('notification_config')
        .update({ dias_anticipacion: diasAnticipacion })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      if (!data) throw new Error('No se pudo actualizar la configuración de notificaciones')
      return data as NotificationConfig
    }

    const { data, error } = await insforge.database
      .from('notification_config')
      .insert({ dias_anticipacion: diasAnticipacion, admin_id: null })
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('No se pudo crear la configuración de notificaciones')
    return data as NotificationConfig
  },
}
