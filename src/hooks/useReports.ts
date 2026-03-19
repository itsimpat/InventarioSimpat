import { useQuery } from '@tanstack/react-query'
import { reportService } from '../services/reportService'

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => reportService.getDashboardKPIs(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCollaboratorReport(collaboratorId: string) {
  return useQuery({
    queryKey: ['report', 'collaborator', collaboratorId],
    queryFn: () => reportService.getCollaboratorReport(collaboratorId),
    enabled: !!collaboratorId,
  })
}

export function useAreaReport(area: string) {
  return useQuery({
    queryKey: ['report', 'area', area],
    queryFn: () => reportService.getAreaReport(area),
    enabled: !!area,
  })
}

export function useGlobalReport() {
  return useQuery({
    queryKey: ['report', 'global'],
    queryFn: () => reportService.getGlobalReport(),
  })
}

export function useIYReport() {
  return useQuery({
    queryKey: ['report', 'iy'],
    queryFn: () => reportService.getIYReport(),
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => reportService.getRecentActivity(),
    staleTime: 1000 * 60, // 1 minute
  })
}
