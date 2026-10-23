export default function Noticias() {
  const noticias = [
    { id: 1, titulo: 'Gran victoria en el clásico', categoria: 'Resultados', fecha: '2026-10-23', imagen: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', extracto: 'Análisis del partido y estadísticas del encuentro más importante de la temporada.' },
    { id: 2, titulo: 'Nuevas incorporaciones al plantel profesional', categoria: 'Fichajes', fecha: '2026-10-22', imagen: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80', extracto: 'Presentación oficial de los nuevos refuerzos confirmados por la dirección.' },
    { id: 3, titulo: 'Inauguración de nueva cancha de entrenamiento', categoria: 'Instalaciones', fecha: '2026-10-21', imagen: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80', extracto: 'Modernización de infraestructura deportiva con nueva tecnología de monitoreo.' },
    { id: 4, titulo: 'Próximo rival confirmado: Liga Nacional', categoria: 'Fixtures', fecha: '2026-10-20', imagen: 'https://images.unsplash.com/photo-1489945052260-4f21c52268b9?auto=format&fit=crop&w=900&q=80', extracto: 'Confirmación de calendario oficial y sedes de los proximos encuentros.' },
    { id: 5, titulo: 'Lesión de jugador clave genera cambios tácticos', categoria: 'Lesiones', fecha: '2026-10-19', imagen: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80', extracto: 'Informe médico oficial y tiempo de recuperación del futbolista.' },
    { id: 6, titulo: 'Sesión de trabajo cerrada para prensa deportiva', categoria: 'Entrenamientos', fecha: '2026-10-18', imagen: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=80', extracto: 'Preparación del equipo bajo protocolo de confidencialidad deportiva.' },
  ]

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Sala de prensa</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Noticias</h1>
          <p className="text-lg text-white/75">Todas las novedades oficiales del club Juventud Guacarhue</p>
        </div>
      </section>

      <div className="container-max-width">
        <div className="mb-8 flex flex-wrap gap-2">
          {['Todos', 'Resultados', 'Fichajes', 'Fixtures', 'Instalaciones', 'Lesiones'].map((cat) => (
            <button
              key={cat}
              className="rounded border border-neutral-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-neutral-800 hover:border-neutral-900 hover:bg-neutral-100"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-7 lg:grid-cols-[2fr_1fr]">
          <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
            <img src={noticias[0].imagen} alt={noticias[0].titulo} className="h-80 w-full object-cover" />
            <div className="space-y-4 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                {noticias[0].categoria} · {noticias[0].fecha}
              </p>
              <h2 className="text-3xl font-bold text-neutral-950">{noticias[0].titulo}</h2>
              <p className="text-neutral-700">{noticias[0].extracto}</p>
              <button className="border border-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white">
                Leer noticia completa
              </button>
            </div>
          </article>

          <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-neutral-900">Proximas noticias</h3>
            {noticias.slice(1, 4).map((n) => (
              <div key={n.id} className="border-t border-neutral-200 py-3 pt-3 first:border-t-0 first:pt-0">
                <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">{n.categoria}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{n.titulo}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{n.fecha}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {noticias.slice(1).map((noticia) => (
            <article key={noticia.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md hover:shadow-lg transition-shadow">
              <img src={noticia.imagen} alt={noticia.titulo} className="h-48 w-full object-cover" />
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">{noticia.categoria} · {noticia.fecha}</p>
                <h3 className="mt-2 text-lg font-bold text-neutral-900">{noticia.titulo}</h3>
                <p className="mt-2 text-sm text-neutral-600">{noticia.extracto}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="border border-neutral-900 px-8 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white">
            Cargar mas noticias
          </button>
        </div>
      </div>
    </div>
  )
}
