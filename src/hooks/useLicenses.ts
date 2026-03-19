import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { licenseService } from '../services/licenseService'
import type { License, LicenseCategory, LicenseType } from '../types'

type LicenseFilters = {
  collaboratorId?: string
  tipo?: LicenseType
  categoria?: LicenseCategory
  activa?: boolean
}

export function useLicenses(filters?: LicenseFilters) {
  return useQuery({
    queryKey: ['licenses', filters],
    queryFn: () => licenseService.getAll(filters),
  })
}

export function useLicense(id: string) {
  return useQuery({
    queryKey: ['license', id],
    queryFn: () => licenseService.getById(id),
    enabled: !!id,
  })
}

export function useIYLicenses(collaboratorId: string) {
  return useQuery({
    queryKey: ['licenses', 'iy', collaboratorId],
    queryFn: () => licenseService.getIYLicenses(collaboratorId),
    enabled: !!collaboratorId,
  })
}

export function useExpiringSoonLicenses(daysAhead: number) {
  return useQuery({
    queryKey: ['licenses', 'expiring', daysAhead],
    queryFn: () => licenseService.getExpiringSoon(daysAhead),
  })
}

export function useCreateLicense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<License, 'id' | 'created_at' | 'updated_at'>) =>
      licenseService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}

export function useUpdateLicense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<License> }) =>
      licenseService.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['licenses'] })
      void queryClient.invalidateQueries({ queryKey: ['license', id] })
    },
  })
}

export function useDeactivateLicense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => licenseService.deactivate(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['licenses'] })
      void queryClient.invalidateQueries({ queryKey: ['license', id] })
    },
  })
}

export function useReassignLicense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      licenseId,
      newCollaboratorId,
    }: {
      licenseId: string
      newCollaboratorId: string
    }) => licenseService.reassign(licenseId, newCollaboratorId),
    onSuccess: (_, { licenseId }) => {
      void queryClient.invalidateQueries({ queryKey: ['licenses'] })
      void queryClient.invalidateQueries({ queryKey: ['license', licenseId] })
    },
  })
}
