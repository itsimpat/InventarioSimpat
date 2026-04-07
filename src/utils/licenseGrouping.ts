import type { License, LicenseCategory } from '../types'

export interface ProductGroup {
  nombre_producto: string
  categoria: LicenseCategory
  licenses: License[]
  activeCount: number
  inactiveCount: number
  totalCostUSD: number
  collaboratorIds: string[]
  nextRenewal: { date: string; colaborador_id: string } | null
}

export function groupLicensesByProduct(licenses: License[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>()

  for (const license of licenses) {
    const key = license.nombre_producto
    if (!map.has(key)) {
      map.set(key, {
        nombre_producto: key,
        categoria: license.categoria,
        licenses: [],
        activeCount: 0,
        inactiveCount: 0,
        totalCostUSD: 0,
        collaboratorIds: [],
        nextRenewal: null,
      })
    }
    const group = map.get(key)!
    group.licenses.push(license)
    if (license.activa) {
      group.activeCount++
      group.totalCostUSD += license.costo_usd
      group.collaboratorIds.push(license.colaborador_id)
      if (!group.nextRenewal || license.fecha_renovacion < group.nextRenewal.date) {
        group.nextRenewal = { date: license.fecha_renovacion, colaborador_id: license.colaborador_id }
      }
    } else {
      group.inactiveCount++
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombre_producto.localeCompare(b.nombre_producto)
  )
}
