export default function Partidos() {
  const partidos = [
    { id: 1, local: 'Juventud Guacarhue', visitante: 'Deportivo Sur', fecha: '2026-11-15', hora: '19:00', lugar: 'Estadio Municipal', estado: 'PROXIMO', torneo: 'Liga Nacional' },
    { id: 2, local: 'Juventud Guacarhue', visitante: 'Club Union Norte', fecha: '2026-11-22', hora: '21:00', lugar: 'Estadio Municipal', estado: 'PROXIMO', torneo: 'Copa Provincia' },
    { id: 3, local: 'El Andes', visitante: 'Juventud Guacarhue', fecha: '2026-11-29', hora: '18:30', lugar: 'Estadio Andes', estado: 'PROXIMO', torneo: 'Liga Nacional' },
    { id: 4, local: 'Juventud Guacarhue', visitante: 'Equipo D', fecha: '2026-10-15', hora: '20:00', lugar: 'Estadio Municipal', estado: 'FINALIZADO', resultado: '3-1', torneo: 'Liga Nacional' },
    { id: 5, local: 'Club Pacifico', visitante: 'Juventud Guacarhue', fecha: '2026-10-09', hora: '19:30', lugar: 'Estadio Pacifico', estado: 'FINALIZADO', resultado: '2-2', torneo: 'Liga Nacional' },
  ]

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Centro de partidos</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Calendario</h1>
          <p className="text-lg text-white/75">Fixture oficial y resultados de temporada</p>
        </div>
      </section>

      <div className="container-max-width space-y-12">
        <div>
          <h2 className="mb-6 text-2xl font-bold uppercase tracking-[0.05em] text-neutral-950">Proximos encuentros</h2>
          <div className="space-y-4">
            {partidos.filter(p => p.estado === 'PROXIMO').map((p) => (
              <div key={p.id} className="border-l-4 border-amber-400 bg-white px-6 py-5 shadow-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">{p.torneo}</p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Local</p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">{p.local}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">VS</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-600">{new Date(p.fecha).toLocaleDateString('es-CL')}</p>
                    <p className="text-xs text-neutral-500">{p.hora} · {p.lugar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Visitante</p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">{p.visitante}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-bold uppercase tracking-[0.05em] text-neutral-950">Resultados</h2>
          <div className="space-y-4">
            {partidos.filter(p => p.estado === 'FINALIZADO').map((p) => (
              <div key={p.id} className="border-l-4 border-green-600 bg-white px-6 py-5 shadow-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">{p.torneo} · FINALIZADO</p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
                  <div className="text-right md:text-left">
                    <p className="text-xs text-neutral-500 uppercase">Local</p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">{p.local}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600">{p.resultado}</p>
                    <p className="mt-1 text-xs text-neutral-500">{new Date(p.fecha).toLocaleDateString('es-CL')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Visitante</p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">{p.visitante}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
