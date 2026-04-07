import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
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
import { insforge } from './lib/insforge'

function isSessionExpiredError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : ''
  return msg.includes('jwt') || msg.includes('expired') || msg.includes('unauthorized') || msg.includes('401')
}

function handleExpiredSession() {
  insforge.auth.signOut().finally(() => {
    window.location.href = '/login'
  })
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => { if (isSessionExpiredError(error)) handleExpiredSession() },
  }),
  mutationCache: new MutationCache({
    onError: (error) => { if (isSessionExpiredError(error)) handleExpiredSession() },
  }),
})

// Placeholder for pages not yet created (other agents will replace these)
const PlaceholderPage = () => (
  <div className="p-8 text-gray-500">Page under construction...</div>
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
const LicensesGalleryPage = lazy(() =>
  import('./pages/licencias/LicensesGalleryPage').then((m) => ({ default: m.LicensesGalleryPage })).catch(() => ({ default: PlaceholderPage }))
)
const LicenseFormPage = lazy(() =>
  import('./pages/licencias/LicenseFormPage').then((m) => ({ default: m.LicenseFormPage })).catch(() => ({ default: PlaceholderPage }))
)
const LicenseDetailPage = lazy(() =>
  import('./pages/licencias/LicenseDetailPage').then((m) => ({ default: m.LicenseDetailPage })).catch(() => ({ default: PlaceholderPage }))
)
const LicenseProductDashboard = lazy(() =>
  import('./pages/licencias/LicenseProductDashboard').then((m) => ({ default: m.LicenseProductDashboard })).catch(() => ({ default: PlaceholderPage }))
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
  <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
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

              {/* Collaborators */}
              <Route
                path="/collaborators"
                element={
                  <ProtectedRoute>
                    <CollaboratorsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/collaborators/new"
                element={
                  <ProtectedRoute>
                    <CollaboratorFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/collaborators/:id"
                element={
                  <ProtectedRoute>
                    <CollaboratorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/collaborators/:id/edit"
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

              {/* Equipment */}
              <Route
                path="/equipment"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentListPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipment/new"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipment/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipment/:id/edit"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><EquipmentFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Peripherals */}
              <Route
                path="/peripherals"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralsListPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/peripherals/new"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/peripherals/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/peripherals/:id/edit"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><PeripheralFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Licenses */}
              <Route
                path="/licenses"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicensesGalleryPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/licenses/new"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicenseFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/licenses/product/:name"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicenseProductDashboard /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/licenses/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicenseDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/licenses/:id/edit"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><LicenseFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Office */}
              <Route
                path="/office"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><OfficeListPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/office/new"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><OfficeFormPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/office/:id"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><OfficeDetailPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Settings */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><ConfiguracionPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper><ReportesPage /></SuspenseWrapper>
                  </ProtectedRoute>
                }
              />

              {/* History */}
              <Route
                path="/history/:tipo/:id"
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
