export default function Partidos() {
  return (
    <div className="container-max-width py-16">
      <h1 className="text-4xl font-bold mb-8">Calendario de Partidos</h1>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Juventud Guacarhue vs Equipo {i}</h3>
                <p className="text-gray-600 text-sm">Fecha: XX/XX/2026</p>
                <p className="text-gray-600 text-sm">Lugar: Estadio</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">vs</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
