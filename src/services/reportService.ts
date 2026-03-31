import { insforge } from '../lib/insforge'
import { collaboratorService } from './collaboratorService'
import { iyBudgetService } from './iyBudgetService'
import type {
  Collaborator,
  Equipment,
  Peripheral,
  License,
  IYBudget,
  OfficeItem,
  HistoryEvent,
} from '../types'

export type DashboardKPIs = {
  totalEquipos: number
  totalEquiposActivos: number
  licenciasActivas: number
  totalInversionUSD: number
}

export type CollaboratorReport = {
  colaborador: Collaborator
  equipos: Equipment[]
  perifericos: Peripheral[]
  licencias: License[]
  iyBudget: IYBudget | null
  totalInversionUSD: number
}

export type AreaReport = {
  colaboradores: Collaborator[]
  totalEquipos: number
  totalPerifericos: number
  totalLicencias: number
  totalInversionUSD: number
}

export type GlobalReport = {
  equipos: { items: Equipment[]; totalUSD: number }
  perifericos: { items: Peripheral[]; totalUSD: number }
  licencias: { items: License[]; totalUSD: number }
  oficina: { items: OfficeItem[]; totalUSD: number }
  grandTotalUSD: number
}

export type IYReportRow = {
  collaboratorId: string
  nombre: string
  montoTotal: number
  montoGastado: number
  montoDisponible: number
  porcentajeUsado: number
}

export type RecentActivityItem = {
  event: HistoryEvent
  entityNombre: string
}

export const reportService = {
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const [equiposRes, licenciasRes, perifericosRes, oficinaRes] = await Promise.all([
      insforge.database.from('equipment').select(),
      insforge.database.from('licenses').select().eq('activa', true),
      insforge.database.from('peripherals').select(),
      insforge.database.from('office_items').select(),
    ])

    if (equiposRes.error) throw new Error(equiposRes.error.message)
    if (licenciasRes.error) throw new Error(licenciasRes.error.message)
    if (perifericosRes.error) throw new Error(perifericosRes.error.message)
    if (oficinaRes.error) throw new Error(oficinaRes.error.message)

    const equipos = (equiposRes.data ?? []) as Equipment[]
    const licencias = (licenciasRes.data ?? []) as License[]
    const perifericos = (perifericosRes.data ?? []) as Peripheral[]
    const oficina = (oficinaRes.data ?? []) as OfficeItem[]

    const activeStatuses = ['Assigned', 'In Storage', 'Requested', 'Under Repair']
    const totalEquiposActivos = equipos.filter((e) => activeStatuses.includes(e.estatus)).length

    const totalEquiposUSD = equipos.reduce((sum, e) => sum + (e.costo_usd ?? 0), 0)
    const totalPerifericosUSD = perifericos.reduce((sum, p) => sum + (p.costo_usd ?? 0), 0)
    const totalLicenciasUSD = licencias.reduce((sum, l) => sum + (l.costo_usd ?? 0), 0)
    const totalOficinaUSD = oficina.reduce((sum, o) => sum + (o.costo_usd ?? 0) * (o.cantidad ?? 1), 0)

    return {
      totalEquipos: equipos.length,
      totalEquiposActivos,
      licenciasActivas: licencias.length,
      totalInversionUSD: totalEquiposUSD + totalPerifericosUSD + totalLicenciasUSD + totalOficinaUSD,
    }
  },

  async getCollaboratorReport(collaboratorId: string): Promise<CollaboratorReport> {
    const [colaborador, equiposRes, perifericosRes, licenciasRes, iyBudget] = await Promise.all([
      collaboratorService.getById(collaboratorId),
      insforge.database.from('equipment').select().eq('colaborador_id', collaboratorId),
      insforge.database.from('peripherals').select().eq('colaborador_id', collaboratorId),
      insforge.database.from('licenses').select().eq('colaborador_id', collaboratorId).eq('activa', true),
      iyBudgetService.getByCollaboratorId(collaboratorId),
    ])

    if (equiposRes.error) throw new Error(equiposRes.error.message)
    if (perifericosRes.error) throw new Error(perifericosRes.error.message)
    if (licenciasRes.error) throw new Error(licenciasRes.error.message)

    const equipos = (equiposRes.data ?? []) as Equipment[]
    const perifericos = (perifericosRes.data ?? []) as Peripheral[]
    const licencias = (licenciasRes.data ?? []) as License[]

    const totalInversionUSD =
      equipos.reduce((sum, e) => sum + (e.costo_usd ?? 0), 0) +
      perifericos.reduce((sum, p) => sum + (p.costo_usd ?? 0), 0) +
      licencias.reduce((sum, l) => sum + (l.costo_usd ?? 0), 0)

    return { colaborador, equipos, perifericos, licencias, iyBudget, totalInversionUSD }
  },

  async getAreaReport(area: string): Promise<AreaReport> {
    const colaboradores = await collaboratorService.getAll({ area, activo: true })
    const ids = colaboradores.map((c) => c.id)

    if (ids.length === 0) {
      return { colaboradores, totalEquipos: 0, totalPerifericos: 0, totalLicencias: 0, totalInversionUSD: 0 }
    }

    const [equiposRes, perifericosRes, licenciasRes] = await Promise.all([
      insforge.database.from('equipment').select(),
      insforge.database.from('peripherals').select(),
      insforge.database.from('licenses').select().eq('activa', true),
    ])

    if (equiposRes.error) throw new Error(equiposRes.error.message)
    if (perifericosRes.error) throw new Error(perifericosRes.error.message)
    if (licenciasRes.error) throw new Error(licenciasRes.error.message)

    const idSet = new Set(ids)
    const equipos = ((equiposRes.data ?? []) as Equipment[]).filter(
      (e) => e.colaborador_id && idSet.has(e.colaborador_id)
    )
    const perifericos = ((perifericosRes.data ?? []) as Peripheral[]).filter(
      (p) => p.colaborador_id && idSet.has(p.colaborador_id)
    )
    const licencias = ((licenciasRes.data ?? []) as License[]).filter((l) => idSet.has(l.colaborador_id))

    const totalInversionUSD =
      equipos.reduce((sum, e) => sum + (e.costo_usd ?? 0), 0) +
      perifericos.reduce((sum, p) => sum + (p.costo_usd ?? 0), 0) +
      licencias.reduce((sum, l) => sum + (l.costo_usd ?? 0), 0)

    return {
      colaboradores,
      totalEquipos: equipos.length,
      totalPerifericos: perifericos.length,
      totalLicencias: licencias.length,
      totalInversionUSD,
    }
  },

  async getGlobalReport(): Promise<GlobalReport> {
    const [equiposRes, perifericosRes, licenciasRes, oficinaRes] = await Promise.all([
      insforge.database.from('equipment').select(),
      insforge.database.from('peripherals').select(),
      insforge.database.from('licenses').select().eq('activa', true),
      insforge.database.from('office_items').select(),
    ])

    if (equiposRes.error) throw new Error(equiposRes.error.message)
    if (perifericosRes.error) throw new Error(perifericosRes.error.message)
    if (licenciasRes.error) throw new Error(licenciasRes.error.message)
    if (oficinaRes.error) throw new Error(oficinaRes.error.message)

    const equipos = (equiposRes.data ?? []) as Equipment[]
    const perifericos = (perifericosRes.data ?? []) as Peripheral[]
    const licencias = (licenciasRes.data ?? []) as License[]
    const oficina = (oficinaRes.data ?? []) as OfficeItem[]

    const equiposTotal = equipos.reduce((sum, e) => sum + (e.costo_usd ?? 0), 0)
    const perifericosTotal = perifericos.reduce((sum, p) => sum + (p.costo_usd ?? 0), 0)
    const licenciasTotal = licencias.reduce((sum, l) => sum + (l.costo_usd ?? 0), 0)
    const oficinaTotal = oficina.reduce((sum, o) => sum + (o.costo_usd ?? 0) * (o.cantidad ?? 1), 0)

    return {
      equipos: { items: equipos, totalUSD: equiposTotal },
      perifericos: { items: perifericos, totalUSD: perifericosTotal },
      licencias: { items: licencias, totalUSD: licenciasTotal },
      oficina: { items: oficina, totalUSD: oficinaTotal },
      grandTotalUSD: equiposTotal + perifericosTotal + licenciasTotal + oficinaTotal,
    }
  },

  async getIYReport(): Promise<IYReportRow[]> {
    const [colaboradores, licenciasRes, budgetsRes] = await Promise.all([
      collaboratorService.getAll({ activo: true }),
      insforge.database.from('licenses').select().eq('categoria', 'IY').eq('activa', true),
      insforge.database.from('iy_budgets').select(),
    ])

    if (licenciasRes.error) throw new Error(licenciasRes.error.message)
    if (budgetsRes.error) throw new Error(budgetsRes.error.message)

    const licencias = (licenciasRes.data ?? []) as License[]
    const budgets = (budgetsRes.data ?? []) as IYBudget[]

    const budgetMap = new Map(budgets.map((b) => [b.colaborador_id, b]))

    return colaboradores
      .filter((c) => budgetMap.has(c.id))
      .map((c) => {
        const budget = budgetMap.get(c.id)!
        const montoTotal = budget.monto_total
        const montoGastado = licencias
          .filter((l) => l.colaborador_id === c.id)
          .reduce((sum, l) => sum + (l.costo_usd ?? 0), 0)
        const montoDisponible = Math.max(0, montoTotal - montoGastado)
        const porcentajeUsado = montoTotal > 0 ? Math.min(100, (montoGastado / montoTotal) * 100) : 0

        return {
          collaboratorId: c.id,
          nombre: c.nombre,
          montoTotal,
          montoGastado,
          montoDisponible,
          porcentajeUsado,
        }
      })
  },

  async getRecentActivity(): Promise<RecentActivityItem[]> {
    const { data, error } = await insforge.database
      .from('history_events')
      .select()
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw new Error(error.message)

    const events = (data ?? []) as HistoryEvent[]

    const results: RecentActivityItem[] = await Promise.all(
      events.map(async (event) => {
        let entityNombre = event.entidad_id
        try {
          const table =
            event.entidad_tipo === 'Equipment'
              ? 'equipment'
              : event.entidad_tipo === 'Peripheral'
              ? 'peripherals'
              : 'office_items'

          const { data: entity } = await insforge.database
            .from(table)
            .select()
            .eq('id', event.entidad_id)
            .single()

          if (entity) {
            const e = entity as Record<string, unknown>
            if (event.entidad_tipo === 'Equipment' || event.entidad_tipo === 'Peripheral') {
              entityNombre = `${e.marca ?? ''} ${e.modelo ?? ''}`.trim()
            } else {
              entityNombre = (e.nombre as string) ?? event.entidad_id
            }
          }
        } catch {
          // keep entidad_id as fallback
        }

        return { event, entityNombre }
      })
    )

    return results
  },
}
