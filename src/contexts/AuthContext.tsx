import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { insforge } from '../lib/insforge'

export type UserRole = 'admin' | 'viewer'

export interface AuthUser {
  id: string
  email: string
  emailVerified: boolean
  profile: {
    name?: string
    role?: UserRole
    [key: string]: unknown
  }
}

interface SignInResult {
  error: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    insforge.auth.getCurrentSession().then(({ data }) => {
      if (data.session) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email,
          emailVerified: data.session.user.emailVerified,
          profile: (data.session.user.profile as AuthUser['profile']) ?? {},
        })
      }
      setIsLoading(false)
    })
  }, [])

  async function signIn(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (!data) return { error: 'Error al iniciar sesión' }

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      emailVerified: data.user.emailVerified,
      profile: (data.user.profile as AuthUser['profile']) ?? {},
    }

    if (authUser.profile.role !== 'admin') {
      await insforge.auth.signOut()
      return { error: 'No tienes permisos para acceder a esta aplicación.' }
    }

    setUser(authUser)
    return { error: null }
  }

  async function signOut() {
    await insforge.auth.signOut()
    setUser(null)
  }

  const isAdmin = user?.profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
