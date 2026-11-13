import { useState, useEffect, useContext, createContext, useCallback } from 'react'
import { apiUrl, API_BASE_URL } from '../lib/api'
import { guardarEnServidor, hayCambiosSinGuardar } from '../data/clubStore'

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MODERADOR' | 'EDITOR' | 'VIEWER'

export interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: UserRole
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isReady: boolean
  isDemoMode: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string, apellido: string) => Promise<void>
  logout: () => void
  /** Reintenta contra el backend y, si responde, abandona el modo demostración. */
  reconectar: () => Promise<boolean>
}

const DEMO_ADMIN = {
  email: 'admin@example.com',
  password: 'ChangeMe123!',
  user: {
    id: 'demo-admin',
    email: 'admin@example.com',
    nombre: 'Admin',
    apellido: 'Juventud',
    rol: 'ADMIN' as const,
  },
}

export const ROLES_QUE_EDITAN: UserRole[] = ['SUPERADMIN', 'ADMIN', 'MODERADOR', 'EDITOR']

const TODOS_LOS_ROLES: UserRole[] = [...ROLES_QUE_EDITAN, 'VIEWER']

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Error que indica que el backend no está disponible (sin conexión, proxy caído,
 * error 5xx o respuesta que no es JSON). Solo en este caso habilitamos el modo
 * demostración; un 401/400 siempre se muestra como credenciales incorrectas.
 */
class ServidorNoDisponibleError extends Error {}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.nombre === 'string' &&
    typeof candidate.apellido === 'string' &&
    typeof candidate.rol === 'string' &&
    TODOS_LOS_ROLES.includes(candidate.rol as UserRole)
  )
}

/** Pide un login real al backend y normaliza los errores. */
async function pedirLogin(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  let response: Response

  try {
    response = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new ServidorNoDisponibleError(
      `No pudimos conectar con el servidor de autenticacion (${API_BASE_URL}).`,
    )
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 400) {
      throw new Error('El correo o la contrasena no son correctos.')
    }
    throw new ServidorNoDisponibleError(
      `No pudimos conectar con el servidor de autenticacion (${API_BASE_URL}).`,
    )
  }

  let payload: { token?: unknown; user?: unknown }
  try {
    payload = (await response.json()) as { token?: unknown; user?: unknown }
  } catch {
    throw new ServidorNoDisponibleError(
      `El servidor devolvio una respuesta inesperada (${API_BASE_URL}).`,
    )
  }

  if (typeof payload.token !== 'string' || !isUser(payload.user)) {
    throw new ServidorNoDisponibleError('El servidor devolvio una sesion invalida.')
  }

  return { token: payload.token, user: payload.user }
}

/**
 * Comprueba contra el backend que el token guardado siga siendo válido.
 *
 * Devuelve `false` solo cuando el servidor lo rechaza (401/403); si no hay
 * conexión devuelve `true` para no cerrar la sesión por un corte de red.
 */
async function sesionSigueViva(token: string): Promise<boolean> {
  let response: Response

  try {
    response = await fetch(apiUrl('/auth/me'), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    return true
  }

  return !(response.status === 401 || response.status === 403)
}

function persistSession(nextToken: string, nextUser: User): void {
  try {
    localStorage.setItem('token', nextToken)
    localStorage.setItem('user', JSON.stringify(nextUser))
    localStorage.setItem('juventud_auth_demo', nextToken === 'demo-token-local' ? '1' : '0')
  } catch {
    // Si el navegador bloquea el almacenamiento la sesion vive solo en memoria.
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('juventud_auth_demo')
  } catch {
    // Sin acceso al almacenamiento no hay nada que limpiar.
  }
}

/**
 * Publica lo que quedó sin guardar en este navegador en cuanto hay una sesión
 * real. Así, tras volver a entrar, el trabajo pendiente no hay que rehacerlo.
 */
function publicarPendientes(): void {
  if (hayCambiosSinGuardar()) {
    void guardarEnServidor()
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    let activo = true

    const restaurar = async () => {
      try {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')

        if (!savedToken || !savedUser) {
          return
        }

        const parsed: unknown = JSON.parse(savedUser)
        if (!isUser(parsed)) {
          clearSession()
          return
        }

        // Si quedó guardada una sesión de demostración, en desarrollo probamos si
        // el backend ya volvió y la cambiamos por una real. En producción el modo
        // demostración no existe: esa sesión no puede publicar nada, así que se
        // descarta para que el panel pida un login verdadero.
        if (savedToken === 'demo-token-local') {
          if (import.meta.env.PROD) {
            clearSession()
            return
          }

          try {
            const datos = await pedirLogin(DEMO_ADMIN.email, DEMO_ADMIN.password)
            if (!activo) return
            setToken(datos.token)
            setUser(datos.user)
            setIsLoggedIn(true)
            setIsDemoMode(false)
            persistSession(datos.token, datos.user)
            return
          } catch {
            // Sigue sin backend: mantenemos la sesión de demostración.
          }
        }

        if (!activo) return

        // Un token vencido dejaría el panel en un estado falso de sesión: los
        // cambios se guardarían solo en este navegador sin que se notara.
        const sigueViva = await sesionSigueViva(savedToken)
        if (!activo) return

        if (!sigueViva) {
          clearSession()
          return
        }

        setToken(savedToken)
        setUser(parsed)
        setIsLoggedIn(true)
        setIsDemoMode(savedToken === 'demo-token-local')

        // Si quedaron cambios sin publicar, se envían apenas la sesión es válida.
        if (savedToken !== 'demo-token-local') {
          publicarPendientes()
        }
      } catch {
        clearSession()
      } finally {
        if (activo) setIsReady(true)
      }
    }

    void restaurar()

    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase()

    try {
      const datos = await pedirLogin(cleanEmail, password)
      setToken(datos.token)
      setUser(datos.user)
      setIsLoggedIn(true)
      setIsDemoMode(false)
      persistSession(datos.token, datos.user)
      publicarPendientes()
      return
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError || error instanceof ServidorNoDisponibleError

      if (!isNetworkError) {
        throw error
      }

      // En producción no existe el modo demostración: un corte de red no puede
      // dejar una sesión falsa que después nunca podrá publicar los cambios.
      if (import.meta.env.PROD) {
        throw new Error('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.')
      }

      // Fallback de desarrollo cuando backend/base de datos no estan disponibles.
      if (cleanEmail === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
        const demoToken = 'demo-token-local'
        setToken(demoToken)
        setUser(DEMO_ADMIN.user)
        setIsLoggedIn(true)
        setIsDemoMode(true)
        persistSession(demoToken, DEMO_ADMIN.user)
        return
      }

      throw new Error(
        'El servidor no responde. Sin backend solo puedes ingresar con la cuenta de demostracion.',
      )
    }
  }, [])

  /** Reintenta la conexión: si el backend responde, pasa de demo a sesión real. */
  const reconectar = useCallback(async (): Promise<boolean> => {
    try {
      const datos = await pedirLogin(DEMO_ADMIN.email, DEMO_ADMIN.password)
      setToken(datos.token)
      setUser(datos.user)
      setIsLoggedIn(true)
      setIsDemoMode(false)
      persistSession(datos.token, datos.user)
      publicarPendientes()
      return true
    } catch {
      return false
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string, nombre: string, apellido: string) => {
      let response: Response

      try {
        response = await fetch(apiUrl('/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password, nombre, apellido }),
        })
      } catch {
        throw new Error('El servidor no responde. No es posible registrar usuarios en este momento.')
      }

      if (!response.ok) {
        throw new Error('No pudimos crear la cuenta. Revisa los datos e intenta nuevamente.')
      }

      const data: unknown = await response.json()
      const payload = data as { token?: unknown; user?: unknown }

      if (typeof payload.token !== 'string' || !isUser(payload.user)) {
        throw new Error('El servidor devolvio una sesion invalida.')
      }

      setToken(payload.token)
      setUser(payload.user)
      setIsLoggedIn(true)
      setIsDemoMode(false)
      persistSession(payload.token, payload.user)
      publicarPendientes()
    },
    [],
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsLoggedIn(false)
    setIsDemoMode(false)
    clearSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isReady, isDemoMode, token, login, register, logout, reconectar }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    return {
      user: null,
      isLoggedIn: false,
      isReady: true,
      isDemoMode: false,
      token: null,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      reconectar: async () => false,
    }
  }
  return context
}
