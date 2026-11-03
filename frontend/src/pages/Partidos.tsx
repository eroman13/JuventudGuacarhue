import { useClubData } from '../hooks/useClubData'
import { formatFecha } from '../components/admin/ui'

export default function Partidos() {
  const { partidos } = useClubData()

  const proximos = partidos
    .filter((partido) => partido.estado === 'PROXIMO')
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))

  const finalizados = partidos
    .filter((partido) => partido.estado === 'FINALIZADO')
    .sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`))

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Centro de partidos</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Calendario</h1>
          <p className="text-lg text-white/75">Fixture oficial y resultados de temporada</p>
        </div>
      </section>

      <div className="container-max-width space-y-12">
        <div>
          <h2 className="mb-6 text-2xl font-bold uppercase tracking-[0.05em] text-neutral-950">Proximos encuentros</h2>
          {proximos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center text-sm text-neutral-500">
              No hay partidos programados por ahora. Revisa esta seccion para conocer el proximo
              encuentro.
            </div>
          ) : (
            <div className="space-y-4">
              {proximos.map((p) => (
                <div key={p.id} className="border-l-4 border-blue-500 bg-white px-6 py-5 shadow-md">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{p.torneo}</p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
                    <div>
                      <p className="text-xs uppercase text-neutral-500">Local</p>
                      <p className="mt-1 text-lg font-bold text-neutral-900">{p.local}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">VS</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-600">{formatFecha(p.fecha)}</p>
                      <p className="text-xs text-neutral-500">{p.hora} · {p.lugar}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-neutral-500">Visitante</p>
                      <p className="mt-1 text-lg font-bold text-neutral-900">{p.visitante}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-bold uppercase tracking-[0.05em] text-neutral-950">Resultados</h2>
          {finalizados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-10 text-center text-sm text-neutral-500">
              Aun no hay resultados registrados en esta temporada.
            </div>
          ) : (
            <div className="space-y-4">
              {finalizados.map((p) => (
                <div key={p.id} className="border-l-4 border-green-600 bg-white px-6 py-5 shadow-md">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                    {p.torneo} · FINALIZADO
                  </p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
                    <div className="text-right md:text-left">
                      <p className="text-xs uppercase text-neutral-500">Local</p>
                      <p className="mt-1 text-lg font-bold text-neutral-900">{p.local}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-600">{p.resultado || '-'}</p>
                      <p className="mt-1 text-xs text-neutral-500">{formatFecha(p.fecha)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-neutral-500">Visitante</p>
                      <p className="mt-1 text-lg font-bold text-neutral-900">{p.visitante}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
