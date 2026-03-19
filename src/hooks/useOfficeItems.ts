import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { officeItemService } from '../services/officeItemService'
import type { OfficeItem, OfficeItemCategory } from '../types'

type OfficeItemFilters = {
  categoria?: OfficeItemCategory
}

export function useOfficeItems(filters?: OfficeItemFilters) {
  return useQuery({
    queryKey: ['office_items', filters],
    queryFn: () => officeItemService.getAll(filters),
  })
}

export function useOfficeItem(id: string) {
  return useQuery({
    queryKey: ['office_item', id],
    queryFn: () => officeItemService.getById(id),
    enabled: !!id,
  })
}

export function useCreateOfficeItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<OfficeItem, 'id' | 'created_at' | 'updated_at'>) =>
      officeItemService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['office_items'] })
    },
  })
}

export function useUpdateOfficeItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OfficeItem> }) =>
      officeItemService.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['office_items'] })
      void queryClient.invalidateQueries({ queryKey: ['office_item', id] })
    },
  })
}

export function useUpdateOfficeItemQuantity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      officeItemService.updateQuantity(id, quantity),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['office_items'] })
      void queryClient.invalidateQueries({ queryKey: ['office_item', id] })
    },
  })
}
