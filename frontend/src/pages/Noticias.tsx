import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useClubData } from '../hooks/useClubData'
import { ImagePreview, formatFecha } from '../components/admin/ui'

const TODAS = 'Todas'

export default function Noticias() {
  const { noticias } = useClubData()
  const [categoria, setCategoria] = useState(TODAS)
  const [visibles, setVisibles] = useState(6)

  const categorias = useMemo(
    () => [TODAS, ...Array.from(new Set(noticias.map((noticia) => noticia.categoria)))],
    [noticias],
  )

  const filtradas = useMemo(
    () =>
      categoria === TODAS
        ? noticias
        : noticias.filter((noticia) => noticia.categoria === categoria),
    [noticias, categoria],
  )

  const principal = filtradas[0]
  const resto = filtradas.slice(1, visibles)
  const hayMas = filtradas.length > visibles

  const cambiarCategoria = (siguiente: string) => {
    setCategoria(siguiente)
    setVisibles(6)
  }

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Sala de prensa</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Noticias</h1>
          <p className="text-lg text-white/75">Todas las novedades oficiales del club Juventud Guacarhue</p>
        </div>
      </section>

      <div className="container-max-width">
        {noticias.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-neutral-700">
              Todavia no hay noticias publicadas
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Vuelve pronto para conocer las novedades del club.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => cambiarCategoria(cat)}
                  className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                    categoria === cat
                      ? 'bg-blue-900 text-white'
                      : 'border border-neutral-300 text-neutral-800 hover:border-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filtradas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-500">
                No hay noticias en la categoria {categoria}.
              </div>
            ) : (
              <>
                {principal && (
                  <div className="grid gap-7 lg:grid-cols-[2fr_1fr]">
                    <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                      <ImagePreview
                        url={principal.imagen}
                        alt={principal.titulo}
                        className="h-80 w-full object-cover"
                      />
                      <div className="space-y-4 p-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                          {principal.categoria} · {formatFecha(principal.fecha)}
                        </p>
                        <h2 className="text-3xl font-bold text-neutral-950">{principal.titulo}</h2>
                        <p className="text-neutral-700">{principal.extracto}</p>
                        <Link
                          to={`/noticias/${principal.id}`}
                          className="inline-block border border-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
                        >
                          Leer noticia completa
                        </Link>
                      </div>
                    </article>

                    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
                      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-neutral-900">
                        Mas noticias
                      </h3>
                      {resto.length === 0 ? (
                        <p className="text-sm text-neutral-500">
                          No hay otras noticias en esta categoria.
                        </p>
                      ) : (
                        resto.map((noticia) => (
                          <div
                            key={noticia.id}
                            className="border-t border-neutral-200 py-3 pt-3 first:border-t-0 first:pt-0"
                          >
                            <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                              {noticia.categoria}
                            </p>
                            <Link
                              to={`/noticias/${noticia.id}`}
                              className="mt-1 block text-sm font-semibold text-neutral-900 hover:text-blue-700"
                            >
                              {noticia.titulo}
                            </Link>
                            <p className="mt-1 text-[11px] text-neutral-500">
                              {formatFecha(noticia.fecha)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {resto.length > 0 && (
                  <div className="mt-12 grid gap-6 md:grid-cols-3">
                    {resto.map((noticia) => (
                      <article
                        key={noticia.id}
                        className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md transition-shadow hover:shadow-lg"
                      >
                        <ImagePreview
                          url={noticia.imagen}
                          alt={noticia.titulo}
                          className="h-48 w-full object-cover"
                        />
                        <div className="p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">
                            {noticia.categoria} · {formatFecha(noticia.fecha)}
                          </p>
                          <h3 className="mt-2 text-lg font-bold text-neutral-900">{noticia.titulo}</h3>
                          <p className="mt-2 text-sm text-neutral-600">{noticia.extracto}</p>
                          <Link
                            to={`/noticias/${noticia.id}`}
                            className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.12em] text-blue-700 hover:text-blue-900"
                          >
                            Leer mas →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {hayMas && (
                  <div className="mt-12 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibles((valor) => valor + 6)}
                      className="border border-neutral-900 px-8 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
                    >
                      Cargar mas noticias
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
