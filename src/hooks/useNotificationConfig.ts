import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationConfigService } from '../services/notificationConfigService'

export function useNotificationConfig() {
  return useQuery({
    queryKey: ['notification_config'],
    queryFn: () => notificationConfigService.get(),
  })
}

export function useUpdateNotificationConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (diasAnticipacion: number) =>
      notificationConfigService.upsert(diasAnticipacion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notification_config'] })
    },
  })
}
