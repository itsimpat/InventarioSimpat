import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { collaboratorService } from '../services/collaboratorService'
import type { Collaborator } from '../types'

type CollaboratorFilters = {
  search?: string
  area?: string
  activo?: boolean
}

export function useCollaborators(filters?: CollaboratorFilters) {
  return useQuery({
    queryKey: ['collaborators', filters],
    queryFn: () => collaboratorService.getAll(filters),
  })
}

export function useCollaborator(id: string) {
  return useQuery({
    queryKey: ['collaborator', id],
    queryFn: () => collaboratorService.getById(id),
    enabled: !!id,
  })
}

export function useCreateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Collaborator, 'id' | 'created_at' | 'updated_at'>) =>
      collaboratorService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
    },
  })
}

export function useUpdateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Collaborator> }) =>
      collaboratorService.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      void queryClient.invalidateQueries({ queryKey: ['collaborator', id] })
    },
  })
}

export function useDeactivateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => collaboratorService.deactivate(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      void queryClient.invalidateQueries({ queryKey: ['collaborator', id] })
    },
  })
}
