import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { ReporteColaborador } from './ReporteColaborador'
import { ReporteArea } from './ReporteArea'
import { ReporteGlobal } from './ReporteGlobal'
import { ReporteIY } from './ReporteIY'

type ReportType = 'colaborador' | 'area' | 'global' | 'iy' | null

const REPORT_CARDS = [
  {
    type: 'colaborador' as ReportType,
    title: 'Por Colaborador',
    description: 'Ver inventario completo asignado a un colaborador',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    activeColor: 'bg-indigo-50 border-indigo-500',
  },
  {
    type: 'area' as ReportType,
    title: 'Por Área',
    description: 'Ver resumen de inversión y activos por área de la empresa',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    activeColor: 'bg-blue-50 border-blue-500',
  },
  {
    type: 'global' as ReportType,
    title: 'Global Empresa',
    description: 'Resumen completo de todos los activos de Simpat Tech',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    color: 'bg-green-50 border-green-200 hover:border-green-400',
    activeColor: 'bg-green-50 border-green-500',
  },
  {
    type: 'iy' as ReportType,
    title: 'IY Budget',
    description: 'Seguimiento del presupuesto Improve Yourself por colaborador',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-purple-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    activeColor: 'bg-purple-50 border-purple-500',
  },
]

export function ReportesPage() {
  const [activeReport, setActiveReport] = useState<ReportType>(null)

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona el tipo de reporte que deseas consultar
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REPORT_CARDS.map((card) => {
            const isActive = activeReport === card.type
            return (
              <button
                key={card.type}
                onClick={() => setActiveReport(isActive ? null : card.type)}
                className={`text-left p-5 rounded-xl border-2 transition-all duration-150 ${
                  isActive ? card.activeColor : card.color
                }`}
              >
                <div className="mb-3">{card.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-snug">{card.description}</p>
                {isActive && (
                  <p className="text-xs font-medium text-gray-400 mt-3 uppercase tracking-wide">
                    Activo — click para cerrar
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {/* Report Content */}
        {activeReport === 'colaborador' && <ReporteColaborador />}
        {activeReport === 'area' && <ReporteArea />}
        {activeReport === 'global' && <ReporteGlobal />}
        {activeReport === 'iy' && <ReporteIY />}
      </div>
    </Layout>
  )
}
