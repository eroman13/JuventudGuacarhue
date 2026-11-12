import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Noticias from './pages/Noticias'
import NoticiaDetalle from './pages/NoticiaDetalle'
import Jugadores from './pages/Jugadores'
import Partidos from './pages/Partidos'
import Galeria from './pages/Galeria'
import Tienda from './pages/Tienda'
import Admin from './pages/Admin'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'
import { useClubData } from './hooks/useClubData'
import { resolveMediaUrl } from './lib/api'
import { sincronizarFavicon } from './lib/favicon'

/**
 * Escudo de respaldo: las iniciales del club en un círculo.
 *
 * Antes acá había una URL de una foto del escudo alojada en Facebook (`fbcdn`),
 * pero esas URLs llevan un token que **caduca**: hoy responden `403`, así que el
 * encabezado mostraba una imagen rota. El logo real se sube desde
 * Panel de administración → Configuración → Identidad del club (queda en el
 * bucket de R2); mientras no haya uno, se ven las iniciales.
 */
function inicialesDe(nombreClub: string): string {
  const iniciales = nombreClub
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return iniciales || 'JG'
}

function AppContent() {
  const { user, isLoggedIn, logout } = useAuth()
  const { config } = useClubData()
  const [logoRoto, setLogoRoto] = useState<string | null>(null)

  // Se guarda la URL que falló (no un simple booleano) para que al subir un logo
  // nuevo se vuelva a intentar sin recargar la página.
  const logoResuelto = resolveMediaUrl(config.logoUrl)
  const mostrarLogo = logoResuelto !== '' && logoRoto !== logoResuelto
  const logoSrc = mostrarLogo ? logoResuelto : ''
  const desde = config.desde.trim()

  // El favicon de la pestaña debe mostrar el mismo logo que el encabezado.
  // Se recalcula cuando cambia `config.logoUrl` (por ejemplo, al subir un
  // logo nuevo desde el panel de administración).
  useEffect(() => {
    sincronizarFavicon(logoSrc)
  }, [logoSrc])

  const navLinkClass =
    'px-3 py-6 text-xs sm:text-sm font-semibold tracking-[0.08em] text-white/85 hover:text-white transition-colors'

  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="site-grid-texture border-b border-blue-900 bg-blue-950 text-white">
          <div className="container-max-width flex min-h-10 items-center justify-between text-[11px] uppercase tracking-[0.1em] text-white/70">
            <p>Sitio oficial Club Deportivo {config.nombreClub}</p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/Guacarhue" target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>
              <span className="text-white/40">Instagram</span>
              <span className="text-white/40">YouTube</span>
            </div>
          </div>
          <nav className="border-t border-white/10">
            <div className="container-max-width flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 py-4">
                {mostrarLogo ? (
                  <img
                    key={logoResuelto}
                    src={logoResuelto}
                    alt={`Escudo ${config.nombreClub}`}
                    className="h-12 w-12 rounded-full border-2 border-blue-300 bg-blue-900 object-cover"
                    onError={() => setLogoRoto(logoResuelto)}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-900 text-xs font-extrabold tracking-widest text-blue-300"
                  >
                    {inicialesDe(config.nombreClub)}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-sm font-bold uppercase tracking-[0.18em]">{config.nombreClub}</div>
                  {desde && (
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">Desde {desde}</div>
                  )}
                </div>
              </Link>

              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/" className={navLinkClass}>INICIO</Link>
                <Link to="/noticias" className={navLinkClass}>NOTICIAS</Link>
                <Link to="/partidos" className={navLinkClass}>PARTIDOS</Link>
                <Link to="/galeria" className={navLinkClass}>GALERIAS</Link>
                <Link to="/jugadores" className={navLinkClass}>PLANTELES</Link>
                <Link to="/tienda" className={navLinkClass}>TIENDA</Link>
              </div>

              <div className="flex items-center gap-3 py-4">
                {isLoggedIn && (
                  <>
                    <Link to="/admin" className="rounded border border-blue-300 bg-blue-400/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-blue-200 hover:bg-blue-400/20">
                      ADMIN
                    </Link>
                    <div className="flex flex-col text-right">
                      <span className="text-[11px] text-white/60">{user?.email}</span>
                      <button onClick={logout} className="text-[11px] text-rose-300 hover:text-rose-200">
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
                {!isLoggedIn && (
                  <Link to="/login" className="rounded border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/10">
                    LOGIN
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/noticias/:id" element={<NoticiaDetalle />} />
            <Route path="/jugadores" element={<Jugadores />} />
            <Route path="/partidos" element={<Partidos />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/tienda" element={<Tienda />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>

        <footer className="mt-16 border-t border-blue-900 bg-blue-950 text-white">
          <div className="container-max-width py-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-blue-300">{config.nombreClub}</h3>
                <p className="text-sm text-white/65">
                  Plataforma oficial para noticias, planteles, calendario deportivo y contenido institucional del club.
                </p>
                <div className="flex gap-3 mt-4">
                  <a href="https://www.facebook.com/Guacarhue" target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-white">Facebook</a>
                  <span className="text-sm text-white/35">Instagram</span>
                  <span className="text-sm text-white/35">YouTube</span>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-blue-300">Navegacion</h4>
                <ul className="space-y-2 text-sm text-white/65">
                  <li><Link to="/" className="hover:text-white transition">Inicio</Link></li>
                  <li><Link to="/noticias" className="hover:text-white transition">Noticias</Link></li>
                  <li><Link to="/partidos" className="hover:text-white transition">Partidos</Link></li>
                  <li><Link to="/galeria" className="hover:text-white transition">Galería</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-blue-300">Secciones</h4>
                <ul className="space-y-2 text-sm text-white/65">
                  <li><Link to="/jugadores" className="hover:text-white transition">Planteles</Link></li>
                  <li><Link to="/tienda" className="hover:text-white transition">Tienda</Link></li>
                  <li><Link to="/login" className="hover:text-white transition">Panel Admin</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-blue-300">Contacto</h4>
                <p className="mb-2 text-sm text-white/65">
                  <strong className="font-semibold text-white/90">Email:</strong><br />
                  info@juventudguacarhue.cl
                </p>
                <p className="text-sm text-white/65">
                  <strong className="font-semibold text-white/90">Telefono:</strong><br />
                  +56 9 XXXX XXXX
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs uppercase tracking-[0.12em] text-white/45">
              <div className="mb-3">Calle Principal 123, Guacarhue · Lun - Vie 09:00 a 18:00</div>
              <div>
                &copy; 2026 Juventud Guacarhue. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default AppContent
