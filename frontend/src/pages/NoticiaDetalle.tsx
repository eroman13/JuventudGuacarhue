import { Link, useParams } from 'react-router-dom'
import { useClubData } from '../hooks/useClubData'
import { ImagePreview, formatFecha } from '../components/admin/ui'
import { RichTextContent } from '../components/RichTextContent'

export default function NoticiaDetalle() {
  const { id } = useParams()
  const { noticias } = useClubData()

  const noticia = noticias.find((item) => String(item.id) === id)

  if (!noticia) {
    return (
      <div className="container-max-width py-20">
        <div className="mx-auto max-w-xl rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Noticia no encontrada</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Es posible que la noticia haya sido eliminada o que el enlace no sea valido.
          </p>
          <Link
            to="/noticias"
            className="mt-6 inline-block border border-neutral-900 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
          >
            Volver a noticias
          </Link>
        </div>
      </div>
    )
  }

  const tieneContenido = Boolean(noticia.contenido && noticia.contenido.trim())

  return (
    <article className="container-max-width py-10">
      <Link
        to="/noticias"
        className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 hover:text-neutral-900"
      >
        ← Volver a noticias
      </Link>

      <div className="mx-auto mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          {noticia.categoria} · {formatFecha(noticia.fecha)}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-neutral-950 sm:text-4xl">
          {noticia.titulo}
        </h1>
        {noticia.extracto && <p className="mt-3 text-lg text-neutral-600">{noticia.extracto}</p>}

        <ImagePreview
          url={noticia.imagen}
          alt={noticia.titulo}
          className="mt-6 h-80 w-full rounded-lg object-cover shadow-md"
        />

        <div className="mt-6">
          {tieneContenido ? (
            <RichTextContent html={noticia.contenido ?? ''} />
          ) : (
            <p className="text-neutral-700">{noticia.extracto}</p>
          )}
        </div>
      </div>
    </article>
  )
}
