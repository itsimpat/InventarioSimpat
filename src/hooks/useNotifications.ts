import { useNotificationConfig } from './useNotificationConfig'
import { useExpiringSoonLicenses } from './useLicenses'

export function useNotifications() {
  const { data: config } = useNotificationConfig()
  const daysAhead = config?.dias_anticipacion ?? 7
  const { data: expiringSoon, isLoading } = useExpiringSoonLicenses(daysAhead)

  return {
    expiringSoon: expiringSoon ?? [],
    daysAhead,
    hasAlerts: (expiringSoon?.length ?? 0) > 0,
    isLoading,
  }
}
