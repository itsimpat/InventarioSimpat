import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/shared/Toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { DashboardPage } from './pages/DashboardPage'
import { CollaboratorsListPage } from './pages/colaboradores/CollaboratorsListPage'
import { CollaboratorFormPage } from './pages/colaboradores/CollaboratorFormPage'
import { CollaboratorDetailPage } from './pages/colaboradores/CollaboratorDetailPage'
import { AdminsPage } from './pages/admins/AdminsPage'

const queryClient = new QueryClient()

// Placeholder for pages not yet created (other agents will replace these)
const PlaceholderPage = () => (
  <div className="p-8 text-gray-500">Página en construcción...</div>
)

// Lazy imports for Agente 2 — Equipos
const EquipmentListPage = lazy(() =>
  import('./pages/equipos/EquipmentListPage').then((m) => ({ default: m.EquipmentListPage })).catch(() => ({ default: PlaceholderPage }))
)
const EquipmentFormPage = lazy(() =>
  import('./pages/equipos/EquipmentFormPage').then((m) => ({ default: m.EquipmentFormPage })).catch(() => ({ default: PlaceholderPage }))
)
const EquipmentDetailPage = lazy(() =>
  import('./pages/equipos/EquipmentDetailPage').then((m) => ({ default: m.EquipmentDetailPage })).catch(() => ({ default: PlaceholderPage }))
)

// Lazy imports for Agente 2 — Periféricos
const PeripheralsListPage = lazy(() =>
  import('./pages/perifericos/PeripheralsListPage').then((m) => ({ default: m.PeripheralsListPage })).catch(() => ({ default: PlaceholderPage }))
)
const PeripheralFormPage = lazy(() =>
  import('./pages/perifericos/PeripheralFormPage').then((m) => ({ default: m.PeripheralFormPage })).catch(() => ({ default: PlaceholderPage }))
)
const PeripheralDetailPage = lazy(() =>
  import('./pages/perifericos/PeripheralDetailPage').then((m) => ({ default: m.PeripheralDetailPage })).catch(() => ({ default: PlaceholderPage }))
)

// Lazy imports for Agente 3 — Licencias
const LicensesListPage = lazy(() =>
  import('./pages/licencias/LicensesListPage').then((m) => ({ default: m.LicensesListPage })).catch(() => ({ default: PlaceholderPage }))
)
const LicenseFormPage = lazy(() =>
  import('./pages/licencias/LicenseFormPage').then((m) => ({ default: m.LicenseFormPage })).catch(() => ({ default: PlaceholderPage }))
)
const LicenseDetailPage = lazy(() =>
  import('./pages/licencias/LicenseDetailPage').then((m) => ({ default: m.LicenseDetailPage })).catch(() => ({ default: PlaceholderPage }))
)

// Lazy imports for Agente 4 — Oficina, Reportes, Configuración, Historial
const OfficeListPage = lazy(() =>
  import('./pages/oficina/OfficeListPage').then((m) => ({ default: m.OfficeListPage })).catch(() => ({ default: PlaceholderPage }))
)
const OfficeFormPage = lazy(() =>
  import('./pages/oficina/OfficeFormPage').then((m) => ({ default: m.OfficeFormPage })).catch(() => ({ default: PlaceholderPage }))
)
const OfficeDetailPage = lazy(() =>
  import('./pages/oficina/OfficeDetailPage').then((m) => ({ default: m.OfficeDetailPage })).catch(() => ({ default: PlaceholderPage }))
)
const ConfiguracionPage = lazy(() =>
  import('./pages/configuracion/ConfiguracionPage').then((m) => ({ default: m.ConfiguracionPage })).catch(() => ({ default: PlaceholderPage }))
)
const ReportesPage = lazy(() =>
  import('./pages/reportes/ReportesPage').then((m) => ({ default: m.ReportesPage })).catch(() => ({ default: PlaceholderPage }))
)
const HistorialPage = lazy(() =>
  import('./pages/historial/HistorialPage').then((m) => ({ default: m.HistorialPage })).catch(() => ({ default: PlaceholderPage }))
)

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="p-8 text-gray-400">Cargando...</div>}>
    {children}
  </Suspense>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Colaboradores */}
              <Route
                path="/colaboradores"
                element={
                  <ProtectedRoute>
                    <CollaboratorsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/colaboradores/nuevo"
                element={
                  <ProtectedRoute>
                    <CollaboratorFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/colaboradores/:id"
                element={
                  <ProtectedRoute>
                    <CollaboratorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/colaboradores/:id/editar"
                element={
                  <ProtectedRoute>
                    <CollaboratorFormPage />
                  </ProtectedRoute>
                }
              />

              {/* Admins */}
              <Route
                path="/admins"
                element={
                  <ProtectedRoute>
                    <AdminsPage />
                  </ProtectedRoute>
                }
              />

              {/* Equipos */}
              <Route
                path="/equipos"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentListPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipos/nuevo"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipos/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipos/:id/editar"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Periféricos */}
              <Route
                path="/perifericos"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralsListPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perifericos/nuevo"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perifericos/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perifericos/:id/editar"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Licencias */}
              <Route
                path="/licencias"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicensesListPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/licencias/nueva"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicenseFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/licencias/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicenseDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/licencias/:id/editar"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicenseFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Oficina */}
              <Route
                path="/oficina"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><OfficeListPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/oficina/nuevo"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><OfficeFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/oficina/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><OfficeDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Configuración */}
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><ConfiguracionPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Reportes */}
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><ReportesPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Historial */}
              <Route
                path="/historial/:tipo/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><HistorialPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
