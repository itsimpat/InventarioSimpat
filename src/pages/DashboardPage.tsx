import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Simpat Tech Inventario</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
          Dashboard — en construcción
        </div>
      </div>
    </div>
  )
}
