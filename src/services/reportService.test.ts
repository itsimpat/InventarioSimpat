import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeBuilder } from '../test/mockInsforge'

vi.mock('../lib/insforge', () => ({
  insforge: { database: { from: vi.fn() } },
}))
vi.mock('./collaboratorService', () => ({
  collaboratorService: {
    getById: vi.fn(),
    getAll: vi.fn(),
  },
}))
vi.mock('./iyBudgetService', () => ({
  iyBudgetService: { getByCollaboratorId: vi.fn() },
}))

import { insforge } from '../lib/insforge'
import { collaboratorService } from './collaboratorService'
import { iyBudgetService } from './iyBudgetService'
import { reportService } from './reportService'

const mockFrom = vi.mocked(insforge.database.from)
const mockGetById = vi.mocked(collaboratorService.getById)
const mockGetAll = vi.mocked(collaboratorService.getAll)
const mockGetBudget = vi.mocked(iyBudgetService.getByCollaboratorId)

const colabBase = {
  id: 'c1', nombre: 'Ana', area: 'Dev', puesto: 'Dev', email: 'ana@s.com',
  activo: true, fecha_ingreso: '2023-01-01', created_at: '', updated_at: '',
}
const equipBase = {
  id: 'e1', marca: 'Apple', modelo: 'MBP', anio_compra: 2023,
  costo_mxn: 34000, costo_usd: 2000, especificaciones: {},
  estatus: 'Asignado' as const, colaborador_id: 'c1',
  fecha_compra: '2023-01-01', created_at: '', updated_at: '',
}
const periBase = {
  id: 'p1', tipo: 'Monitor' as const, marca: 'LG', modelo: '27', costo_mxn: 8500,
  costo_usd: 500, fecha_compra: '2023-01-01', estatus: 'Asignado' as const,
  colaborador_id: 'c1', created_at: '', updated_at: '',
}
const licBase = {
  id: 'l1', nombre_producto: 'GitHub', tipo: 'Mensual' as const, costo_mxn: 340,
  costo_usd: 20, fecha_renovacion: '2025-04-15', colaborador_id: 'c1',
  categoria: 'IY' as const, activa: true, created_at: '', updated_at: '',
}
const officeBase = {
  id: 'o1', nombre: 'Silla', categoria: 'Silla' as const, marca: 'HM',
  costo_mxn: 15000, costo_usd: 882, fecha_compra: '2023-01-01',
  cantidad: 2, created_at: '', updated_at: '',
}
const budgetBase = {
  id: 'b1', colaborador_id: 'c1', monto_total: 1000, created_at: '', updated_at: '',
}

beforeEach(() => vi.clearAllMocks())

describe('reportService.getDashboardKPIs', () => {
  it('calcula KPIs correctamente', async () => {
    const equipInBodega = { ...equipBase, estatus: 'Vendido' as const }
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: [equipBase, equipInBodega], error: null })) // equipment
      .mockReturnValueOnce(makeBuilder({ data: [licBase], error: null }))                  // licenses
      .mockReturnValueOnce(makeBuilder({ data: [periBase], error: null }))                 // peripherals
      .mockReturnValueOnce(makeBuilder({ data: [officeBase], error: null }))               // office_items

    const kpis = await reportService.getDashboardKPIs()

    expect(kpis.totalEquipos).toBe(2)
    expect(kpis.totalEquiposActivos).toBe(1) // solo el Asignado
    expect(kpis.licenciasActivas).toBe(1)
    // Ambos equipos (Asignado + Vendido) se suman a totalInversionUSD
    expect(kpis.totalInversionUSD).toBeCloseTo(2000 + 2000 + 500 + 20 + 882 * 2)
  })

  it('lanza error cuando falla la consulta de equipos', async () => {
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: null, error: { message: 'DB error' } }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))
    await expect(reportService.getDashboardKPIs()).rejects.toThrow('DB error')
  })

  it('cuenta como activos: Asignado, En Bodega, Solicitado, En Reparación', async () => {
    const equipos = [
      { ...equipBase, estatus: 'Asignado' as const },
      { ...equipBase, id: 'e2', estatus: 'En Bodega' as const },
      { ...equipBase, id: 'e3', estatus: 'Solicitado' as const },
      { ...equipBase, id: 'e4', estatus: 'En Reparación' as const },
      { ...equipBase, id: 'e5', estatus: 'Vendido' as const },
      { ...equipBase, id: 'e6', estatus: 'Dado de Baja' as const },
    ]
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: equipos, error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))

    const kpis = await reportService.getDashboardKPIs()
    expect(kpis.totalEquiposActivos).toBe(4)
  })
})

describe('reportService.getCollaboratorReport', () => {
  it('construye el reporte del colaborador con totales USD', async () => {
    mockGetById.mockResolvedValue(colabBase)
    mockGetBudget.mockResolvedValue(budgetBase)
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: [equipBase], error: null }))   // equipment
      .mockReturnValueOnce(makeBuilder({ data: [periBase], error: null }))    // peripherals
      .mockReturnValueOnce(makeBuilder({ data: [licBase], error: null }))     // licenses

    const report = await reportService.getCollaboratorReport('c1')

    expect(report.colaborador).toEqual(colabBase)
    expect(report.equipos).toEqual([equipBase])
    expect(report.perifericos).toEqual([periBase])
    expect(report.licencias).toEqual([licBase])
    expect(report.iyBudget).toEqual(budgetBase)
    expect(report.totalInversionUSD).toBeCloseTo(2000 + 500 + 20)
  })
})

describe('reportService.getAreaReport', () => {
  it('retorna reporte vacío cuando no hay colaboradores en el área', async () => {
    mockGetAll.mockResolvedValue([])
    const report = await reportService.getAreaReport('Diseño')
    expect(report.totalEquipos).toBe(0)
    expect(report.totalPerifericos).toBe(0)
    expect(report.totalInversionUSD).toBe(0)
  })

  it('calcula totales filtrando por colaboradores del área', async () => {
    mockGetAll.mockResolvedValue([colabBase])
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: [equipBase, { ...equipBase, id: 'e2', colaborador_id: 'c99' }], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [periBase], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [licBase], error: null }))

    const report = await reportService.getAreaReport('Dev')
    expect(report.totalEquipos).toBe(1)  // solo el de c1
    expect(report.totalPerifericos).toBe(1)
    expect(report.totalLicencias).toBe(1)
    expect(report.totalInversionUSD).toBeCloseTo(2000 + 500 + 20)
  })
})

describe('reportService.getGlobalReport', () => {
  it('calcula totales globales por categoría', async () => {
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: [equipBase], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [periBase], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [licBase], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [officeBase], error: null }))

    const report = await reportService.getGlobalReport()

    expect(report.equipos.totalUSD).toBeCloseTo(2000)
    expect(report.perifericos.totalUSD).toBeCloseTo(500)
    expect(report.licencias.totalUSD).toBeCloseTo(20)
    expect(report.oficina.totalUSD).toBeCloseTo(882 * 2) // cantidad * costo_usd
    expect(report.grandTotalUSD).toBeCloseTo(2000 + 500 + 20 + 882 * 2)
  })
})

describe('reportService.getIYReport', () => {
  it('calcula montos gastados y disponibles por colaborador', async () => {
    mockGetAll.mockResolvedValue([colabBase])
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: [licBase], error: null }))   // IY licenses
      .mockReturnValueOnce(makeBuilder({ data: [budgetBase], error: null })) // budgets

    const report = await reportService.getIYReport()
    expect(report).toHaveLength(1)
    expect(report[0].montoTotal).toBe(1000)
    expect(report[0].montoGastado).toBeCloseTo(20)
    expect(report[0].montoDisponible).toBeCloseTo(980)
    expect(report[0].porcentajeUsado).toBeCloseTo(2)
  })

  it('capea porcentajeUsado en 100 cuando se excede el presupuesto', async () => {
    const budgetSmall = { ...budgetBase, monto_total: 10 }
    const licExpensive = { ...licBase, costo_usd: 50 }
    mockGetAll.mockResolvedValue([colabBase])
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: [licExpensive], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [budgetSmall], error: null }))

    const report = await reportService.getIYReport()
    expect(report[0].porcentajeUsado).toBe(100)
    expect(report[0].montoDisponible).toBe(0) // Math.max(0, ...)
  })

  it('excluye colaboradores sin presupuesto IY', async () => {
    mockGetAll.mockResolvedValue([colabBase])
    mockFrom
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))  // licenses
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))  // budgets (vacío)

    const report = await reportService.getIYReport()
    expect(report).toHaveLength(0)
  })
})
