import { useClubData } from '../hooks/useClubData'

export default function Jugadores() {
  const { planteles } = useClubData()

  const totalJugadores = planteles.reduce((total, plantel) => total + plantel.jugadores.length, 0)

  return (
    <div className="space-y-12 pb-10">
      <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Plantel profesional</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Jugadores</h1>
          <p className="text-lg text-white/75">Planteles del Club Deportivo Juventud Guacarhue</p>
        </div>
      </section>

      <div className="container-max-width space-y-16">
        {planteles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-neutral-700">
              Planteles en actualizacion
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Estamos preparando la informacion de nuestros equipos. Vuelve pronto.
            </p>
          </div>
        ) : (
          planteles.map((plantel) => (
            <div key={plantel.nombre}>
              <div className="mb-8 border-l-4 border-blue-500 pl-4">
                <h2 className="text-3xl font-bold uppercase tracking-[0.04em] text-neutral-950">
                  {plantel.nombre}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {plantel.jugadores.length}{' '}
                  {plantel.jugadores.length === 1 ? 'jugador' : 'jugadores'}
                </p>
              </div>

              {plantel.jugadores.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center text-sm text-neutral-500">
                  Este plantel todavia no tiene jugadores registrados.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {plantel.jugadores.map((j) => (
                    <div
                      key={j.id}
                      className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md transition-shadow hover:shadow-lg"
                    >
                      <div className="bg-gradient-to-br from-blue-900 to-blue-950 px-4 py-8 text-center">
                        <p className="text-6xl font-bold text-blue-300">
                          #{String(j.numero).padStart(2, '0')}
                        </p>
                      </div>
                      <div className="space-y-3 p-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                            Posicion
                          </p>
                          <p className="text-sm font-bold text-neutral-900">{j.posicion}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                            Nombre
                          </p>
                          <p className="text-lg font-bold text-neutral-900">
                            {j.nombre} {j.apellido}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                            Pais
                          </p>
                          <p className="text-sm font-semibold text-neutral-900">{j.pais}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {planteles.length > 0 && (
          <p className="text-center text-xs uppercase tracking-[0.12em] text-neutral-400">
            {totalJugadores} jugadores registrados en {planteles.length}{' '}
            {planteles.length === 1 ? 'plantel' : 'planteles'}
          </p>
        )}
      </div>
    </div>
  )
}
