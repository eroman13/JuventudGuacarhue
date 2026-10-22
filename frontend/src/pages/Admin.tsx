import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (!isLoggedIn) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-8">Panel Admin</h2>
          <nav className="space-y-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('noticias')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'noticias' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              Noticias
            </button>
            <button
              onClick={() => setActiveTab('jugadores')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'jugadores' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              Jugadores
            </button>
            <button
              onClick={() => setActiveTab('partidos')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'partidos' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              Partidos
            </button>
            <button
              onClick={() => setActiveTab('galeria')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'galeria' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              Galería
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`w-full text-left px-4 py-2 rounded ${
                activeTab === 'productos' ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="w-full text-left px-4 py-2 rounded hover:bg-red-600 mt-8"
            >
              Cerrar Sesión
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Top Bar */}
          <div className="bg-white shadow">
            <div className="px-8 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Administración</h1>
              <div className="text-sm">
                <p>Bienvenido, <strong>{user?.nombre}</strong></p>
                <p className="text-gray-500">Rol: {user?.rol}</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-3xl font-bold mb-8">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-blue-600">0</div>
                    <p className="text-gray-600 mt-2">Noticias</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-green-600">0</div>
                    <p className="text-gray-600 mt-2">Jugadores</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-purple-600">0</div>
                    <p className="text-gray-600 mt-2">Partidos</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-orange-600">0</div>
                    <p className="text-gray-600 mt-2">Productos</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'noticias' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Gestión de Noticias</h2>
                  <button className="btn-primary bg-blue-600 text-white">
                    + Nueva Noticia
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <p className="text-gray-500">No hay noticias. Crea una para comenzar.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jugadores' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Gestión de Jugadores</h2>
                  <button className="btn-primary bg-blue-600 text-white">
                    + Nuevo Jugador
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <p className="text-gray-500">No hay jugadores. Agrega uno para comenzar.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'partidos' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Gestión de Partidos</h2>
                  <button className="btn-primary bg-blue-600 text-white">
                    + Nuevo Partido
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <p className="text-gray-500">No hay partidos. Crea uno para comenzar.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'galeria' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Gestión de Galería</h2>
                  <button className="btn-primary bg-blue-600 text-white">
                    + Subir Fotos
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <p className="text-gray-500">No hay fotos. Sube algunas para comenzar.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'productos' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Gestión de Productos</h2>
                  <button className="btn-primary bg-blue-600 text-white">
                    + Nuevo Producto
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <p className="text-gray-500">No hay productos. Crea uno para comenzar.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
