import { useState } from 'react'
import { useGlobalReport } from '../../hooks/useReports'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatUSD } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import type { Equipment, Peripheral, License, OfficeItem } from '../../types'

function GlobalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/5" />
            <div className="h-4 bg-gray-200 rounded w-1/6" />
          </div>
          <div className="px-5 pb-4 space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-3 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CollapsibleSection({
  title,
  subtotal,
  defaultOpen = false,
  children,
}: {
  title: string
  subtotal: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        <span className="text-sm font-semibold text-gray-700">{formatUSD(subtotal)}</span>
      </button>

      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  )
}

function EquipmentTable({ items }: { items: Equipment[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 italic px-5 py-4">Sin registros</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Marca</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Modelo</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Año</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Estatus</th>
            <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo USD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-gray-800">{e.marca}</td>
              <td className="px-5 py-3 text-gray-600">{e.modelo}</td>
              <td className="px-5 py-3 text-gray-500">{e.anio_compra}</td>
              <td className="px-5 py-3 text-gray-500">{e.estatus}</td>
              <td className="px-5 py-3 text-right text-gray-800">{formatUSD(e.costo_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PeripheralTable({ items }: { items: Peripheral[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 italic px-5 py-4">Sin registros</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Marca</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Modelo</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Estatus</th>
            <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo USD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 text-gray-500">{p.tipo}</td>
              <td className="px-5 py-3 font-medium text-gray-800">{p.marca}</td>
              <td className="px-5 py-3 text-gray-600">{p.modelo}</td>
              <td className="px-5 py-3 text-gray-500">{p.estatus}</td>
              <td className="px-5 py-3 text-right text-gray-800">{formatUSD(p.costo_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LicenseTable({ items }: { items: License[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 italic px-5 py-4">Sin registros</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Categoría</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Renovación</th>
            <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo USD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-gray-800">{l.nombre_producto}</td>
              <td className="px-5 py-3 text-gray-500">{l.tipo}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    l.categoria === 'IY'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {l.categoria}
                </span>
              </td>
              <td className="px-5 py-3 text-gray-500">{formatDate(l.fecha_renovacion)}</td>
              <td className="px-5 py-3 text-right text-gray-800">{formatUSD(l.costo_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OfficeTable({ items }: { items: OfficeItem[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 italic px-5 py-4">Sin registros</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Categoría</th>
            <th className="px-5 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Marca</th>
            <th className="px-5 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
            <th className="px-5 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Costo USD (total)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-gray-800">{o.nombre}</td>
              <td className="px-5 py-3 text-gray-500">{o.categoria}</td>
              <td className="px-5 py-3 text-gray-600">{o.marca}</td>
              <td className="px-5 py-3 text-center text-gray-600">{o.cantidad}</td>
              <td className="px-5 py-3 text-right text-gray-800">
                {formatUSD(o.costo_usd * (o.cantidad ?? 1))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReporteGlobal() {
  const { data: report, isLoading, isError } = useGlobalReport()

  if (isLoading) return <GlobalSkeleton />

  if (isError || !report) {
    return <EmptyState title="No se pudo cargar el reporte global" />
  }

  return (
    <div className="space-y-4">
      {/* Equipos */}
      <CollapsibleSection
        title={`Equipos (${report.equipos.items.length})`}
        subtotal={report.equipos.totalUSD}
        defaultOpen
      >
        <EquipmentTable items={report.equipos.items} />
      </CollapsibleSection>

      {/* Periféricos */}
      <CollapsibleSection
        title={`Periféricos (${report.perifericos.items.length})`}
        subtotal={report.perifericos.totalUSD}
      >
        <PeripheralTable items={report.perifericos.items} />
      </CollapsibleSection>

      {/* Licencias */}
      <CollapsibleSection
        title={`Licencias activas (${report.licencias.items.length})`}
        subtotal={report.licencias.totalUSD}
      >
        <LicenseTable items={report.licencias.items} />
      </CollapsibleSection>

      {/* Inventario Oficina */}
      <CollapsibleSection
        title={`Inventario Oficina (${report.oficina.items.length})`}
        subtotal={report.oficina.totalUSD}
      >
        <OfficeTable items={report.oficina.items} />
      </CollapsibleSection>

      {/* Grand Total */}
      <div className="bg-green-600 rounded-xl p-5 text-white">
        <p className="text-sm font-medium text-green-200 uppercase tracking-wide mb-1">
          Grand Total — Todos los activos de Simpat Tech
        </p>
        <p className="text-4xl font-bold">{formatUSD(report.grandTotalUSD)}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Equipos', value: report.equipos.totalUSD },
            { label: 'Periféricos', value: report.perifericos.totalUSD },
            { label: 'Licencias', value: report.licencias.totalUSD },
            { label: 'Oficina', value: report.oficina.totalUSD },
          ].map((item) => (
            <div key={item.label} className="bg-green-700/50 rounded-lg p-3">
              <p className="text-xs text-green-300 mb-0.5">{item.label}</p>
              <p className="text-sm font-semibold">{formatUSD(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
