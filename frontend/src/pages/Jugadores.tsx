export default function Jugadores() {
  const planteles = [
    {
      nombre: 'Primer Equipo',
      jugadores: [
        { numero: 1, nombre: 'Carlos', apellido: 'González', posicion: 'Portero', pais: 'Chile' },
        { numero: 2, nombre: 'Juan', apellido: 'Rodríguez', posicion: 'Defensa', pais: 'Chile' },
        { numero: 4, nombre: 'Miguel', apellido: 'Flores', posicion: 'Defensa', pais: 'Chile' },
        { numero: 7, nombre: 'Pablo', apellido: 'Soto', posicion: 'Mediocampista', pais: 'Chile' },
        { numero: 10, nombre: 'Diego', apellido: 'Vargas', posicion: 'Delantero', pais: 'Chile' },
        { numero: 9, nombre: 'Fernando', apellido: 'Silva', posicion: 'Delantero', pais: 'Brasil' },
        { numero: 11, nombre: 'Roberto', apellido: 'López', posicion: 'Extremo', pais: 'Paraguay' },
      ],
    },
    {
      nombre: 'Reserva',
      jugadores: [
        { numero: 20, nombre: 'Francisco', apellido: 'García', posicion: 'Portero', pais: 'Chile' },
        { numero: 21, nombre: 'Andrés', apellido: 'Peña', posicion: 'Defensa', pais: 'Chile' },
        { numero: 23, nombre: 'Javier', apellido: 'Riquelme', posicion: 'Mediocampista', pais: 'Chile' },
        { numero: 25, nombre: 'Eduardo', apellido: 'Díaz', posicion: 'Delantero', pais: 'Chile' },
      ],
    },
  ]

  return (
    <div className="space-y-12 pb-10">
      <section className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Plantel profesional</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Jugadores</h1>
          <p className="text-lg text-white/75">Planteles del Club Deportivo Juventud Guacarhue</p>
        </div>
      </section>

      <div className="container-max-width space-y-16">
        {planteles.map((plantel) => (
          <div key={plantel.nombre}>
            <div className="mb-8 border-l-4 border-amber-400 pl-4">
              <h2 className="text-3xl font-bold uppercase tracking-[0.04em] text-neutral-950">{plantel.nombre}</h2>
              <p className="text-sm text-neutral-600 mt-1">{plantel.jugadores.length} jugadores</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {plantel.jugadores.map((j) => (
                <div key={j.numero} className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 px-4 py-8 text-center">
                    <p className="text-6xl font-bold text-amber-300">#{j.numero.toString().padStart(2, '0')}</p>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Posición</p>
                      <p className="text-sm font-bold text-neutral-900">{j.posicion}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Nombre</p>
                      <p className="text-lg font-bold text-neutral-900">{j.nombre} {j.apellido}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">País</p>
                      <p className="text-sm font-semibold text-neutral-900">{j.pais}</p>
                    </div>
                    <button className="w-full border border-neutral-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-neutral-800 hover:bg-neutral-100">
                      Ver perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
