export default function Galeria() {
  const fotos = [
    { id: 1, categoria: 'Partidos', fecha: '2026-10-20', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80' },
    { id: 2, categoria: 'Entrenamientos', fecha: '2026-10-19', url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80' },
    { id: 3, categoria: 'Partidos', fecha: '2026-10-18', url: 'https://images.unsplash.com/photo-1489945052260-4f21c52268b9?auto=format&fit=crop&w=600&q=80' },
    { id: 4, categoria: 'Eventos', fecha: '2026-10-17', url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=600&q=80' },
    { id: 5, categoria: 'Equipo', fecha: '2026-10-16', url: 'https://images.unsplash.com/photo-1494173853739-c21f58b16055?auto=format&fit=crop&w=600&q=80' },
    { id: 6, categoria: 'Entrenamientos', fecha: '2026-10-15', url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80' },
    { id: 7, categoria: 'Partidos', fecha: '2026-10-14', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80' },
    { id: 8, categoria: 'Eventos', fecha: '2026-10-13', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80' },
    { id: 9, categoria: 'Equipo', fecha: '2026-10-12', url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80' },
    { id: 10, categoria: 'Partidos', fecha: '2026-10-11', url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=600&q=80' },
    { id: 11, categoria: 'Entrenamientos', fecha: '2026-10-10', url: 'https://images.unsplash.com/photo-1489945052260-4f21c52268b9?auto=format&fit=crop&w=600&q=80' },
    { id: 12, categoria: 'Eventos', fecha: '2026-10-09', url: 'https://images.unsplash.com/photo-1494173853739-c21f58b16055?auto=format&fit=crop&w=600&q=80' },
  ]

  const categorias = ['Todos', 'Partidos', 'Entrenamientos', 'Eventos', 'Equipo']

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Galeria multimedia</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Fotos</h1>
          <p className="text-lg text-white/75">Registro fotografico oficial de actividades del club</p>
        </div>
      </section>

      <div className="container-max-width">
        <div className="mb-8 flex flex-wrap gap-2">
          {categorias.map((cat) => (
            <button
              key={cat}
              className="rounded border border-neutral-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-neutral-800 hover:border-neutral-900 hover:bg-neutral-100"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow aspect-square"
            >
              <img src={foto.url} alt={foto.categoria} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-semibold text-white uppercase tracking-[0.08em]">{foto.categoria}</p>
                <p className="text-[11px] text-white/70">{foto.fecha}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
