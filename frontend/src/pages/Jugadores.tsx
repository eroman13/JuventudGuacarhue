export default function Jugadores() {
  return (
    <div className="container-max-width py-16">
      <h1 className="text-4xl font-bold mb-8">Nuestros Jugadores</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-4">
              <h3 className="font-bold text-lg">#00</h3>
              <p className="text-gray-600 text-sm">Nombre Jugador</p>
              <p className="text-gray-500 text-xs">Posición</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
