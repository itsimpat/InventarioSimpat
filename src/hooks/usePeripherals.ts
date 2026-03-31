import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { peripheralService } from '../services/peripheralService'
import type { Peripheral } from '../types'

type PeripheralFilters = {
  tipo?: string
  status?: string
  ownership?: 'Storage' | 'Collaborator'
  collaboratorId?: string
}

export function usePeripheralList(filters?: PeripheralFilters) {
  return useQuery({
    queryKey: ['peripherals', filters],
    queryFn: () => peripheralService.getAll(filters),
  })
}

export function usePeripheral(id: string) {
  return useQuery({
    queryKey: ['peripherals', id],
    queryFn: () => peripheralService.getById(id),
    enabled: !!id,
  })
}

export function useCreatePeripheral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Peripheral, 'id' | 'created_at' | 'updated_at'>) =>
      peripheralService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['peripherals'] })
    },
  })
}

export function useUpdatePeripheral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Peripheral> }) =>
      peripheralService.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['peripherals'] })
      void queryClient.invalidateQueries({ queryKey: ['peripherals', id] })
    },
  })
}

export function useChangePeripheralStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      peripheralService.changeStatus(id, status),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['peripherals'] })
      void queryClient.invalidateQueries({ queryKey: ['peripherals', id] })
    },
  })
}

export function useAssignPeripheral() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      peripheralId,
      collaboratorId,
      registradoPor,
    }: {
      peripheralId: string
      collaboratorId: string
      registradoPor: string
    }) => peripheralService.assignToCollaborator(peripheralId, collaboratorId, registradoPor),
    onSuccess: (_, { peripheralId }) => {
      void queryClient.invalidateQueries({ queryKey: ['peripherals'] })
      void queryClient.invalidateQueries({ queryKey: ['peripherals', peripheralId] })
      void queryClient.invalidateQueries({ queryKey: ['historyEvents', 'Peripheral', peripheralId] })
    },
  })
}

export function useReturnToStorage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      peripheralId,
      registradoPor,
    }: {
      peripheralId: string
      registradoPor: string
    }) => peripheralService.returnToStorage(peripheralId, registradoPor),
    onSuccess: (_, { peripheralId }) => {
      void queryClient.invalidateQueries({ queryKey: ['peripherals'] })
      void queryClient.invalidateQueries({ queryKey: ['peripherals', peripheralId] })
      void queryClient.invalidateQueries({ queryKey: ['historyEvents', 'Peripheral', peripheralId] })
    },
  })
}
