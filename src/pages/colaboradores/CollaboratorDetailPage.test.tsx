import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CollaboratorDetailPage } from './CollaboratorDetailPage'

// Mock Layout to avoid AuthContext dependency
vi.mock('../../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock all data hooks
vi.mock('../../hooks/useCollaborators', () => ({
  useCollaborator: vi.fn(),
  useDeactivateCollaborator: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))
vi.mock('../../hooks/useIYBudget', () => ({
  useIYBudget: vi.fn(() => ({ data: undefined })),
  useUpsertIYBudget: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}))
vi.mock('../../hooks/useEquipment', () => ({
  useEquipmentList: vi.fn(() => ({ data: [] })),
}))
vi.mock('../../hooks/usePeripherals', () => ({
  usePeripheralList: vi.fn(() => ({ data: [] })),
}))
vi.mock('../../hooks/useLicenses', () => ({
  useLicenses: vi.fn(() => ({ data: [] })),
}))
vi.mock('../../components/shared/Toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}))

import { useCollaborator } from '../../hooks/useCollaborators'
import { useEquipmentList } from '../../hooks/useEquipment'
import { usePeripheralList } from '../../hooks/usePeripherals'
import { useLicenses } from '../../hooks/useLicenses'

const mockUseCollaborator = vi.mocked(useCollaborator)
const mockUseEquipmentList = vi.mocked(useEquipmentList)
const mockUsePeripheralList = vi.mocked(usePeripheralList)
const mockUseLicenses = vi.mocked(useLicenses)

const colabBase = {
  id: 'c1',
  nombre: 'Ana López',
  area: 'Ingeniería',
  puesto: 'Dev',
  email: 'ana@simpat.com',
  activo: true,
  fecha_ingreso: '2023-01-10',
  created_at: '2023-01-10',
  updated_at: '2023-01-10',
}

const equipBase = {
  id: 'e1',
  marca: 'Apple',
  modelo: 'MacBook Pro',
  anio_compra: 2023,
  costo_mxn: 40000,
  costo_usd: 2000,
  especificaciones: { cpu: 'M2', ram: '16GB' },
  estatus: 'Asignado' as const,
  colaborador_id: 'c1',
  fecha_compra: '2023-01-15',
  created_at: '2023-01-15',
  updated_at: '2023-01-15',
}

const periBase = {
  id: 'p1',
  tipo: 'Monitor' as const,
  marca: 'LG',
  modelo: '27UL600',
  costo_mxn: 8500,
  costo_usd: 425,
  fecha_compra: '2023-06-01',
  estatus: 'Asignado' as const,
  colaborador_id: 'c1',
  created_at: '2023-06-01',
  updated_at: '2023-06-01',
}

const licBase = {
  id: 'l1',
  nombre_producto: 'GitHub Copilot',
  tipo: 'Mensual' as const,
  costo_mxn: 340,
  costo_usd: 17,
  fecha_renovacion: '2025-12-01',
  colaborador_id: 'c1',
  categoria: 'IY' as const,
  activa: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/colaboradores/c1']}>
      <Routes>
        <Route path="/colaboradores/:id" element={<CollaboratorDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseCollaborator.mockReturnValue({ data: colabBase, isLoading: false, refetch: vi.fn() } as never)
  mockUseEquipmentList.mockReturnValue({ data: [] } as never)
  mockUsePeripheralList.mockReturnValue({ data: [] } as never)
  mockUseLicenses.mockReturnValue({ data: [] } as never)
})

describe('CollaboratorDetailPage — información general', () => {
  it('muestra el nombre y puesto del colaborador', () => {
    renderPage()
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    // 'Dev' aparece en el subtitle del header y en la grilla — verificamos que existe al menos uno
    expect(screen.getAllByText('Dev').length).toBeGreaterThan(0)
  })

  it('muestra el área y email', () => {
    renderPage()
    expect(screen.getByText('Ingeniería')).toBeInTheDocument()
    expect(screen.getByText('ana@simpat.com')).toBeInTheDocument()
  })

  it('muestra estado loading mientras carga', () => {
    mockUseCollaborator.mockReturnValue({ data: undefined, isLoading: true, refetch: vi.fn() } as never)
    renderPage()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('muestra mensaje cuando el colaborador no existe', () => {
    mockUseCollaborator.mockReturnValue({ data: undefined, isLoading: false, refetch: vi.fn() } as never)
    renderPage()
    expect(screen.getByText('Colaborador no encontrado')).toBeInTheDocument()
  })
})

describe('CollaboratorDetailPage — sección equipos', () => {
  it('muestra "Sin equipos asignados" cuando no tiene equipos', () => {
    renderPage()
    expect(screen.getByText('Sin equipos asignados')).toBeInTheDocument()
  })

  it('muestra el equipo asignado en una card', () => {
    mockUseEquipmentList.mockReturnValue({ data: [equipBase] } as never)
    renderPage()
    expect(screen.getByText('Apple MacBook Pro')).toBeInTheDocument()
    expect(screen.getByText('Compra 2023')).toBeInTheDocument()
  })

  it('muestra las specs del equipo si existen', () => {
    mockUseEquipmentList.mockReturnValue({ data: [equipBase] } as never)
    renderPage()
    expect(screen.getByText(/M2.*16GB/)).toBeInTheDocument()
  })

  it('muestra el costo en USD del equipo', () => {
    mockUseEquipmentList.mockReturnValue({ data: [equipBase] } as never)
    renderPage()
    expect(screen.getByText('$2,000.00 USD')).toBeInTheDocument()
  })

  it('muestra el counter de equipos en el header de la sección', () => {
    mockUseEquipmentList.mockReturnValue({ data: [equipBase] } as never)
    renderPage()
    const equiposSection = screen.getByText('Equipos asignados')
    expect(equiposSection).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('pasa collaboratorId al hook de equipos', () => {
    renderPage()
    expect(mockUseEquipmentList).toHaveBeenCalledWith(
      expect.objectContaining({ collaboratorId: 'c1' })
    )
  })
})

describe('CollaboratorDetailPage — sección periféricos', () => {
  it('muestra "Sin periféricos asignados" cuando no tiene periféricos', () => {
    renderPage()
    expect(screen.getByText('Sin periféricos asignados')).toBeInTheDocument()
  })

  it('muestra el periférico asignado en una card', () => {
    mockUsePeripheralList.mockReturnValue({ data: [periBase] } as never)
    renderPage()
    expect(screen.getByText('LG 27UL600')).toBeInTheDocument()
    expect(screen.getByText('Monitor')).toBeInTheDocument()
  })

  it('pasa collaboratorId al hook de periféricos', () => {
    renderPage()
    expect(mockUsePeripheralList).toHaveBeenCalledWith(
      expect.objectContaining({ collaboratorId: 'c1' })
    )
  })
})

describe('CollaboratorDetailPage — sección licencias', () => {
  it('muestra "Sin licencias asignadas" cuando no tiene licencias', () => {
    renderPage()
    expect(screen.getByText('Sin licencias asignadas')).toBeInTheDocument()
  })

  it('muestra la licencia activa con nombre y tipo', () => {
    mockUseLicenses.mockReturnValue({ data: [licBase] } as never)
    renderPage()
    expect(screen.getByText('GitHub Copilot')).toBeInTheDocument()
    expect(screen.getByText('Mensual · IY')).toBeInTheDocument()
  })

  it('muestra badge Activa para licencias activas', () => {
    mockUseLicenses.mockReturnValue({ data: [licBase] } as never)
    renderPage()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('muestra badge Inactiva para licencias inactivas', () => {
    mockUseLicenses.mockReturnValue({ data: [{ ...licBase, activa: false }] } as never)
    renderPage()
    expect(screen.getByText('Inactiva')).toBeInTheDocument()
  })

  it('muestra el costo en USD de la licencia', () => {
    mockUseLicenses.mockReturnValue({ data: [licBase] } as never)
    renderPage()
    expect(screen.getByText('$17.00 USD')).toBeInTheDocument()
  })

  it('pasa collaboratorId al hook de licencias', () => {
    renderPage()
    expect(mockUseLicenses).toHaveBeenCalledWith(
      expect.objectContaining({ collaboratorId: 'c1' })
    )
  })

  it('muestra el conteo de licencias IY activas en el presupuesto IY', () => {
    mockUseLicenses.mockReturnValue({ data: [licBase] } as never)
    renderPage()
    expect(screen.getByText('1 licencia(s)')).toBeInTheDocument()
  })
})

describe('CollaboratorDetailPage — modal desactivar', () => {
  it('muestra aviso de licencias IY cuando el colaborador tiene activas', () => {
    mockUseLicenses.mockReturnValue({ data: [licBase] } as never)
    renderPage()

    const desactivarBtn = screen.getByRole('button', { name: 'Desactivar' })
    fireEvent.click(desactivarBtn)

    expect(screen.getByText(/licencias IY activas/)).toBeInTheDocument()
  })
})
