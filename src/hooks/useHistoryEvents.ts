import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { historyEventService } from '../services/historyEventService'
import type { HistoryEvent, EntityType } from '../types'

export function useHistoryEvents(tipo: EntityType, entityId: string) {
  return useQuery({
    queryKey: ['historyEvents', tipo, entityId],
    queryFn: () => historyEventService.getByEntity(tipo, entityId),
    enabled: !!entityId,
  })
}

export function useCreateHistoryEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (event: Omit<HistoryEvent, 'id' | 'created_at'>) =>
      historyEventService.create(event),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['historyEvents', variables.entidad_tipo, variables.entidad_id],
      })
    },
  })
}
