import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentService } from '../services/equipmentService'
import type { Equipment, EquipmentStatus } from '../types'

type EquipmentFilters = {
  status?: EquipmentStatus
  collaboratorId?: string
  brand?: string
}

export function useEquipmentList(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: () => equipmentService.getAll(filters),
  })
}

export function useEquipment(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentService.getById(id),
    enabled: !!id,
  })
}

export function useCreateEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) =>
      equipmentService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
  })
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) =>
      equipmentService.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['equipment', id] })
    },
  })
}

export function useChangeEquipmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EquipmentStatus }) =>
      equipmentService.changeStatus(id, status),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['equipment', id] })
    },
  })
}

export function useAssignEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      equipmentId,
      collaboratorId,
      registradoPor,
    }: {
      equipmentId: string
      collaboratorId: string
      registradoPor: string
    }) => equipmentService.assign(equipmentId, collaboratorId, registradoPor),
    onSuccess: (_, { equipmentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] })
      void queryClient.invalidateQueries({ queryKey: ['historyEvents', 'Equipment', equipmentId] })
    },
  })
}

export function useUnassignEquipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      equipmentId,
      registradoPor,
    }: {
      equipmentId: string
      registradoPor: string
    }) => equipmentService.unassign(equipmentId, registradoPor),
    onSuccess: (_, { equipmentId }) => {
      void queryClient.invalidateQueries({ queryKey: ['equipment'] })
      void queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] })
      void queryClient.invalidateQueries({ queryKey: ['historyEvents', 'Equipment', equipmentId] })
    },
  })
}
