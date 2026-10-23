import { useState, useEffect, useContext, createContext } from 'react'

interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: 'SUPERADMIN' | 'ADMIN' | 'MODERADOR' | 'EDITOR' | 'VIEWER'
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string, apellido: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Login fallido')
    }

    const data = await response.json()
    setToken(data.token)
    setUser(data.user)
    setIsLoggedIn(true)

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const register = async (email: string, password: string, nombre: string, apellido: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre, apellido }),
    })

    if (!response.ok) {
      throw new Error('Registro fallido')
    }

    const data = await response.json()
    setToken(data.token)
    setUser(data.user)
    setIsLoggedIn(true)

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsLoggedIn(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, token, login, register, logout }}>
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
      token: null,
      login: async () => {},
      register: async () => {},
      logout: () => {},
    }
  }
  return context
}
