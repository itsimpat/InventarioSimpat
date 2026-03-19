import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { iyBudgetService } from '../services/iyBudgetService'

export function useIYBudget(collaboratorId: string) {
  return useQuery({
    queryKey: ['iy_budget', collaboratorId],
    queryFn: () => iyBudgetService.getByCollaboratorId(collaboratorId),
    enabled: !!collaboratorId,
  })
}

export function useUpsertIYBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      collaboratorId,
      montoTotal,
    }: {
      collaboratorId: string
      montoTotal: number
    }) => iyBudgetService.upsert(collaboratorId, montoTotal),
    onSuccess: (_, { collaboratorId }) => {
      void queryClient.invalidateQueries({ queryKey: ['iy_budget', collaboratorId] })
    },
  })
}
