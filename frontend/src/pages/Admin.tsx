import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ROLES_QUE_EDITAN, useAuth } from '../hooks/useAuth'
import { useClubData } from '../hooks/useClubData'
import { API_BASE_URL } from '../lib/api'
import { ADMIN_TABS, type AdminTab } from '../components/admin/tabs'
import { Badge, type Notify } from '../components/admin/ui'
import Dashboard from '../components/admin/Dashboard'
import NoticiasManager from '../components/admin/NoticiasManager'
import JugadoresManager from '../components/admin/JugadoresManager'
import PartidosManager from '../components/admin/PartidosManager'
import GaleriaManager from '../components/admin/GaleriaManager'
import TiendaManager from '../components/admin/TiendaManager'
import VideosManager from '../components/admin/VideosManager'
import PedidosManager from '../components/admin/PedidosManager'
import AbonadosManager from '../components/admin/AbonadosManager'
import ConfigPanel from '../components/admin/ConfigPanel'
import RespaldoPanel from '../components/admin/RespaldoPanel'

const TAB_DESCRIPTIONS: Record<AdminTab, string> = {
  dashboard: 'Resumen general',
  noticias: 'Comunicados y novedades',
  jugadores: 'Planteles y fichas',
  partidos: 'Calendario y resultados',
  galeria: 'Fotos del club',
  productos: 'Tienda oficial',
  videos: 'Multimedia y transmisiones',
  pedidos: 'Ventas y despachos',
  abonados: 'Membresias del club',
  config: 'Ajustes del sitio',
  respaldo: 'Exportar e importar datos',
}

interface ToastState {
  message: string
  tone: 'success' | 'error'
}

export default function Admin() {
  const { user, isLoggedIn, isReady, isDemoMode, logout, reconectar } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [reconectando, setReconectando] = useState(false)
  const timerRef = useRef<number | null>(null)
  const { sincronizacion, recargarContenido } = useClubData()

  const syncTone =
    sincronizacion.estado === 'sincronizado'
      ? 'green'
      : sincronizacion.estado === 'error' || sincronizacion.estado === 'sin-sesion'
        ? 'amber'
        : 'blue'

  const syncLabel =
    sincronizacion.estado === 'sincronizado'
      ? 'Contenido en el servidor'
      : sincronizacion.estado === 'guardando'
        ? 'Guardando...'
        : sincronizacion.estado === 'sin-sesion'
          ? 'Solo este navegador'
          : sincronizacion.estado === 'error'
            ? 'Sin conexión al servidor'
            : 'Cargando contenido'

  const notify = useCallback<Notify>((message, tone = 'success') => {
    setToast({ message, tone })
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => setToast(null), 4200)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const canManage = user ? ROLES_QUE_EDITAN.includes(user.rol) : false

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleReconectar = async () => {
    setReconectando(true)
    const conectado = await reconectar()
    setReconectando(false)
    if (!conectado) {
      notify('Seguimos sin conexión con el servidor. Revisa que el backend esté corriendo.', 'error')
    }
  }

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        Cargando panel...
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-300">
              Juventud Guacarhue
            </p>
            <h1 className="mt-1 text-xl font-bold uppercase tracking-[0.05em] sm:text-2xl">
              Panel de administracion
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-[11px] text-slate-400">{user.email}</p>
            </div>
            <Badge tone={canManage ? 'green' : 'amber'}>{user.rol}</Badge>
            <button
              type="button"
              onClick={() => void recargarContenido(true)}
              title={`${sincronizacion.mensaje} (haz clic para recargar el contenido del servidor)`}
            >
              <Badge tone={syncTone}>{syncLabel}</Badge>
            </button>
            <Link
              to="/"
              className="rounded-lg border border-white/20 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-200 transition hover:border-white/40 hover:text-white"
            >
              Ver sitio
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-rose-700"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      {isDemoMode && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <div>
              <p className="text-xs font-semibold text-amber-800">
                Sesion de demostracion: el backend no esta disponible. Los contenidos se guardan solo
                en este navegador.
              </p>
              <p className="mt-0.5 break-all text-[10px] uppercase tracking-[0.06em] text-amber-700/80">
                API configurada: {API_BASE_URL}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReconectar}
              disabled={reconectando}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reconectando ? 'Reintentando...' : 'Reintentar conexion'}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <nav aria-label="Secciones del panel" className="lg:w-60 lg:flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                  activeTab === tab.id
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-4 lg:block">
            {ADMIN_TABS.map((tab) => {
              const activo = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activo ? 'page' : undefined}
                  className={`mb-1 flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left transition ${
                    activo ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.08em]">{tab.label}</span>
                  <span
                    className={`text-[10px] ${activo ? 'text-blue-100' : 'text-slate-400'}`}
                  >
                    {TAB_DESCRIPTIONS[tab.id]}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard canManage={canManage} onNavigate={setActiveTab} />
          )}
          {activeTab === 'noticias' && <NoticiasManager canManage={canManage} notify={notify} />}
          {activeTab === 'jugadores' && <JugadoresManager canManage={canManage} notify={notify} />}
          {activeTab === 'partidos' && <PartidosManager canManage={canManage} notify={notify} />}
          {activeTab === 'galeria' && <GaleriaManager canManage={canManage} notify={notify} />}
          {activeTab === 'productos' && <TiendaManager canManage={canManage} notify={notify} />}
          {activeTab === 'videos' && <VideosManager canManage={canManage} notify={notify} />}
          {activeTab === 'pedidos' && <PedidosManager canManage={canManage} notify={notify} />}
          {activeTab === 'abonados' && <AbonadosManager canManage={canManage} notify={notify} />}
          {activeTab === 'config' && <ConfigPanel notify={notify} />}
          {activeTab === 'respaldo' && <RespaldoPanel canManage={canManage} notify={notify} />}
        </main>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-[90] flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-xl ${
            toast.tone === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar notificacion"
            className="text-white/80 transition hover:text-white"
          >
            x
          </button>
        </div>
      )}
    </div>
  )
}
