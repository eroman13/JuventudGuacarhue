import { useMemo, useState } from 'react'
import { useClubData } from '../hooks/useClubData'
import { ImagePreview, formatFecha } from '../components/admin/ui'
import { resolveMediaUrl } from '../lib/api'

const TODAS = 'Todas'

export default function Galeria() {
  const { galeria: fotos } = useClubData()
  const [categoria, setCategoria] = useState(TODAS)
  const [ampliada, setAmpliada] = useState<number | null>(null)

  const categorias = useMemo(
    () => [TODAS, ...Array.from(new Set(fotos.map((foto) => foto.categoria)))],
    [fotos],
  )

  const filtradas = useMemo(
    () => (categoria === TODAS ? fotos : fotos.filter((foto) => foto.categoria === categoria)),
    [fotos, categoria],
  )

  const fotoAmpliada = filtradas.find((foto) => foto.id === ampliada) ?? null

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Galeria multimedia</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Fotos</h1>
          <p className="text-lg text-white/75">Registro fotografico oficial de actividades del club</p>
        </div>
      </section>

      <div className="container-max-width">
        {fotos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-neutral-700">
              Todavia no hay fotos publicadas
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Pronto compartiremos imagenes de partidos, entrenamientos y eventos.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
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
                No hay fotos en la categoria {categoria}.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filtradas.map((foto) => (
                  <button
                    key={foto.id}
                    type="button"
                    onClick={() => setAmpliada(foto.id)}
                    aria-label={`Ampliar foto de ${foto.categoria}`}
                    className="group relative aspect-square overflow-hidden rounded-lg text-left shadow-md transition-shadow hover:shadow-lg"
                  >
                    <ImagePreview
                      url={foto.url}
                      alt={foto.categoria}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white">
                        {foto.categoria}
                      </p>
                      <p className="text-[11px] text-white/70">{formatFecha(foto.fecha)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setAmpliada(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
        >
          <div className="max-h-full w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={resolveMediaUrl(fotoAmpliada.url)}
              alt={fotoAmpliada.categoria}
              className="mx-auto max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <div className="mt-3 flex items-center justify-between gap-3 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em]">
                  {fotoAmpliada.categoria}
                </p>
                <p className="text-[11px] text-white/60">{formatFecha(fotoAmpliada.fecha)}</p>
              </div>
              <button
                type="button"
                onClick={() => setAmpliada(null)}
                className="rounded border border-white/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
