/**
 * Mantiene el favicon del sitio sincronizado con el logo del club.
 *
 * El logo se puede cambiar desde el panel de administración
 * (Configuración → Identidad del club), por lo que su URL cambia con cada
 * subida. Con esta función el ícono de la pestaña del navegador siempre
 * muestra la misma imagen que el escudo del encabezado, sin tener que editar
 * `index.html` cada vez que se sube un logo nuevo.
 */

/** Devuelve el MIME de la imagen a partir de la extensión de la URL. */
function tipoMimeImagen(url: string): string | undefined {
  const ruta = url.split(/[?#]/)[0].toLowerCase()

  if (ruta.endsWith('.svg')) return 'image/svg+xml'
  if (ruta.endsWith('.png')) return 'image/png'
  if (ruta.endsWith('.webp')) return 'image/webp'
  if (ruta.endsWith('.gif')) return 'image/gif'
  if (ruta.endsWith('.ico')) return 'image/x-icon'
  if (ruta.endsWith('.jpg') || ruta.endsWith('.jpeg')) return 'image/jpeg'

  return undefined
}

/** Crea o actualiza un `<link rel="...">` del `<head>` del documento. */
function aplicarEnlace(rel: string, url: string, type?: string): void {
  let enlace = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!enlace) {
    enlace = document.createElement('link')
    enlace.rel = rel
    document.head.appendChild(enlace)
  }

  if (type) {
    enlace.type = type
  } else {
    enlace.removeAttribute('type')
  }

  enlace.href = url
}

/**
 * Hace que el favicon (y el ícono para iOS) apunten a `url`.
 * Sin una URL válida no hace nada, para conservar el favicon por defecto.
 */
export function sincronizarFavicon(url: string): void {
  const destino = url.trim()

  if (typeof document === 'undefined' || !destino) {
    return
  }

  const type = tipoMimeImagen(destino)

  aplicarEnlace('icon', destino, type)
  aplicarEnlace('apple-touch-icon', destino, type)
}
