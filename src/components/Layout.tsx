import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Props = {
  children: ReactNode
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/colaboradores', label: 'Colaboradores' },
  { to: '/admins', label: 'Administradores' },
  { to: '/equipos', label: 'Equipos' },
  { to: '/perifericos', label: 'Periféricos' },
  { to: '/licencias', label: 'Licencias' },
  { to: '/oficina', label: 'Inventario Oficina' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/configuracion', label: 'Configuración' },
]

export function Layout({ children }: Props) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 left-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-700">
          <span className="text-lg font-semibold tracking-tight">Simpat Inventario</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, label, exact }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={exact}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate mb-2">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
