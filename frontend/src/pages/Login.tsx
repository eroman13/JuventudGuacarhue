import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { inputClass, labelClass, primaryButtonClass } from '../components/admin/ui'

const DEMO_EMAIL = 'admin@example.com'
const DEMO_PASSWORD = 'ChangeMe123!'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login, isLoggedIn, isReady } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contrasena.')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesion.')
    } finally {
      setIsLoading(false)
    }
  }

  const usarDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        Cargando...
      </div>
    )
  }

  if (isLoggedIn) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-950 text-sm font-extrabold tracking-widest text-blue-200">
            JG
          </div>
          <h1 className="mt-4 text-2xl font-bold uppercase tracking-[0.04em] text-slate-950">
            Juventud Guacarhue
          </h1>
          <p className="mt-1 text-sm text-slate-500">Acceso al panel de administracion</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className={labelClass}>
              Correo electronico
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={inputClass}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className={labelClass}>
              Contrasena
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className={inputClass}
              placeholder="Tu contrasena"
            />
          </div>

          <button type="submit" disabled={isLoading} className={`${primaryButtonClass} w-full`}>
            {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-800">
            Credenciales de demostracion
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Correo: <code className="rounded bg-white px-1.5 py-0.5">{DEMO_EMAIL}</code>
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Contrasena: <code className="rounded bg-white px-1.5 py-0.5">{DEMO_PASSWORD}</code>
          </p>
          <button
            type="button"
            onClick={usarDemo}
            className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700 underline-offset-4 hover:underline"
          >
            Completar credenciales
          </button>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 hover:text-slate-800"
        >
          Volver al sitio
        </Link>
      </div>
    </div>
  )
}
