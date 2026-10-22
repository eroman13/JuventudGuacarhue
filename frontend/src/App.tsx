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

function App() {
  const { user, isLoggedIn } = useAuth()

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Header/Navbar */}
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="container-max-width">
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="text-2xl font-bold">
                ⚽ Juventud Guacarhue
              </Link>
              <div className="flex gap-4 items-center">
                <Link to="/" className="hover:opacity-80">Inicio</Link>
                <Link to="/noticias" className="hover:opacity-80">Noticias</Link>
                <Link to="/jugadores" className="hover:opacity-80">Jugadores</Link>
                <Link to="/partidos" className="hover:opacity-80">Partidos</Link>
                <Link to="/galeria" className="hover:opacity-80">Galería</Link>
                <Link to="/tienda" className="hover:opacity-80">Tienda</Link>
                {isLoggedIn && (
                  <Link to="/admin" className="hover:opacity-80 font-bold">
                    Admin
                  </Link>
                )}
                {isLoggedIn ? (
                  <span className="text-sm bg-blue-700 px-3 py-1 rounded">
                    {user?.email}
                  </span>
                ) : (
                  <Link to="/login" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
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

        {/* Footer */}
        <footer className="bg-gray-800 text-white">
          <div className="container-max-width py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold mb-4">Juventud Guacarhue</h3>
                <p className="text-gray-400">
                  Club deportivo dedicado a la formación y competencia de atletas.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-4">Enlaces rápidos</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/noticias">Noticias</Link></li>
                  <li><Link to="/partidos">Partidos</Link></li>
                  <li><Link to="/tienda">Tienda</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Contacto</h3>
                <p className="text-gray-400">
                  Email: info@juventudguacarhue.cl<br />
                  Teléfono: +56 9 XXXX XXXX
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2026 Juventud Guacarhue. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
