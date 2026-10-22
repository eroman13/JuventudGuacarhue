export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container-max-width text-center">
          <h1 className="text-5xl font-bold mb-4">⚽ Juventud Guacarhue</h1>
          <p className="text-xl mb-8">Club deportivo dedicado a la excelencia y formación de atletas</p>
          <div className="flex gap-4 justify-center">
            <a href="/partidos" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Ver Próximos Partidos
            </a>
            <a href="/tienda" className="btn-primary bg-blue-700 hover:bg-blue-800">
              Visitar Tienda
            </a>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-max-width">
          <h2 className="text-3xl font-bold mb-12 text-center">Lo Último</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Próximo Partido</h3>
                <p className="text-gray-600">Cargando información del próximo encuentro...</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-r from-green-400 to-green-600"></div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Últimas Noticias</h3>
                <p className="text-gray-600">Mantente informado sobre todas las novedades del club...</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-r from-purple-400 to-purple-600"></div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Nuestros Jugadores</h3>
                <p className="text-gray-600">Conoce a los atletas que representan al club...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="container-max-width">
          <h2 className="text-3xl font-bold mb-12 text-center">Estadísticas del Club</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">0</div>
              <p className="text-gray-600 mt-2">Títulos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">0</div>
              <p className="text-gray-600 mt-2">Jugadores</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">0</div>
              <p className="text-gray-600 mt-2">Partidos Ganados</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">0</div>
              <p className="text-gray-600 mt-2">Goles Anotados</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
