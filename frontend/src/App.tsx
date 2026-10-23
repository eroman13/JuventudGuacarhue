import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Noticias from './pages/Noticias'
import Jugadores from './pages/Jugadores'
import Partidos from './pages/Partidos'
import Galeria from './pages/Galeria'
import Tienda from './pages/Tienda'
import Admin from './pages/Admin'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'

function AppContent() {
  const { user, isLoggedIn, logout } = useAuth()

  const navLinkClass =
    'px-3 py-6 text-xs sm:text-sm font-semibold tracking-[0.08em] text-white/85 hover:text-white transition-colors'

  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-neutral-100">
        <header className="site-grid-texture border-b border-neutral-800 bg-neutral-950 text-white">
          <div className="container-max-width flex min-h-10 items-center justify-between text-[11px] uppercase tracking-[0.1em] text-white/70">
            <p>Sitio oficial Club Deportivo Juventud Guacarhue</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">Instagram</a>
              <a href="#" className="hover:text-white">YouTube</a>
              <a href="#" className="hover:text-white">Facebook</a>
            </div>
          </div>
          <nav className="border-t border-white/10">
            <div className="container-max-width flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400 bg-neutral-900 text-xs font-extrabold tracking-widest text-amber-400">
                  JG
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-bold uppercase tracking-[0.18em]">Juventud Guacarhue</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">Desde 1990</div>
                </div>
              </Link>

              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/" className={navLinkClass}>INICIO</Link>
                <Link to="/noticias" className={navLinkClass}>NOTICIAS</Link>
                <Link to="/partidos" className={navLinkClass}>PARTIDOS</Link>
                <Link to="/galeria" className={navLinkClass}>GALERIAS</Link>
                <Link to="/jugadores" className={navLinkClass}>PLANTELES</Link>
                <Link to="/tienda" className={navLinkClass}>TIENDA</Link>
                <a href="#" className={navLinkClass}>CLUB</a>
              </div>

              <div className="flex items-center gap-3 py-4">
                {isLoggedIn && (
                  <>
                    <Link to="/admin" className="rounded border border-amber-300 bg-amber-400/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-amber-300 hover:bg-amber-400/20">
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
            <Route path="/jugadores" element={<Jugadores />} />
            <Route path="/partidos" element={<Partidos />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/tienda" element={<Tienda />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>

        <footer className="mt-16 border-t border-neutral-800 bg-neutral-950 text-white">
          <div className="container-max-width py-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-amber-300">Juventud Guacarhue</h3>
                <p className="text-sm text-white/65">
                  Plataforma oficial para noticias, planteles, calendario deportivo y contenido institucional del club.
                </p>
                <div className="flex gap-3 mt-4">
                  <a href="#" className="text-sm text-white/70 hover:text-white">Instagram</a>
                  <a href="#" className="text-sm text-white/70 hover:text-white">YouTube</a>
                  <a href="#" className="text-sm text-white/70 hover:text-white">X</a>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-amber-300">Navegacion</h4>
                <ul className="space-y-2 text-sm text-white/65">
                  <li><Link to="/" className="hover:text-white transition">Inicio</Link></li>
                  <li><Link to="/noticias" className="hover:text-white transition">Noticias</Link></li>
                  <li><Link to="/partidos" className="hover:text-white transition">Partidos</Link></li>
                  <li><Link to="/galeria" className="hover:text-white transition">Galería</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-amber-300">Secciones</h4>
                <ul className="space-y-2 text-sm text-white/65">
                  <li><Link to="/jugadores" className="hover:text-white transition">Planteles</Link></li>
                  <li><Link to="/tienda" className="hover:text-white transition">Tienda</Link></li>
                  <li><Link to="/login" className="hover:text-white transition">Panel Admin</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-amber-300">Contacto</h4>
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
