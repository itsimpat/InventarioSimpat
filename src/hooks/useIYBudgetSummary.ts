import { useIYBudget } from './useIYBudget'
import { useIYLicenses } from './useLicenses'

export function useIYBudgetSummary(collaboratorId: string) {
  const { data: budget, isLoading: isLoadingBudget } = useIYBudget(collaboratorId)
  const { data: iyLicenses, isLoading: isLoadingLicenses } = useIYLicenses(collaboratorId)

  const montoTotal = budget?.monto_total ?? 0
  const montoGastado = (iyLicenses ?? []).reduce((sum, l) => sum + (l.costo_usd ?? 0), 0)
  const montoDisponible = montoTotal - montoGastado
  const porcentajeUsado = montoTotal > 0 ? Math.min((montoGastado / montoTotal) * 100, 100) : 0

  return {
    montoTotal,
    montoGastado,
    montoDisponible,
    porcentajeUsado,
    isLoading: isLoadingBudget || isLoadingLicenses,
  }
}
