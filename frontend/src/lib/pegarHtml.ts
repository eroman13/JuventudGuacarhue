/**
 * Limpieza del HTML que se pega en el editor de noticias del panel.
 *
 * Al copiar un texto desde Facebook (o desde Word, o desde otra pagina) el
 * navegador no entrega texto plano: entrega HTML con estilos en linea, cajas
 * `<div>` por cada linea y — esto es lo que rompe el cuerpo de la noticia —
 * los emojis como **imagenes remotas** (`<img src=".../images/emoji.php/...">`).
 *
 * El extracto es un `<textarea>`, asi que el emoji llega como caracter Unicode
 * y se ve perfecto; el cuerpo es un editor enriquecido y cada uno de esos
 * `<img>` hereda el estilo `.news-content img` (ancho completo, margenes y
 * sombra), de modo que cada emoji termina ocupando una linea entera.
 *
 * Este modulo convierte lo pegado en parrafos limpios: los emojis vuelven a ser
 * caracteres, las fotos de Facebook se descartan (sus URL caducan y dan 403) y
 * el resto queda como `<p>`, titulos, citas, listas y enlaces, sin estilos.
 */

/** Resultado de limpiar un pegado. */
export interface ResultadoPegado {
  /** HTML listo para insertar en el editor (vacio si no habia nada usable). */
  html: string
  /** Cuantos emojis que venian como imagen se recuperaron como caracter. */
  emojis: number
  /** Cuantas imagenes se descartaron (emojis irreconocibles y fotos de Facebook). */
  fotosDescartadas: number
}

/**
 * Formato en linea que se conserva dentro de un parrafo.
 *
 * Solo etiquetas que el saneador deja pasar, para que el cuerpo se vea igual
 * mientras se escribe y en la pagina publica (`sub`, `sup`, `mark`, `code` y
 * compania se desenvuelven y conservan su texto).
 */
const ETIQUETAS_INLINE = new Set(['strong', 'b', 'em', 'i', 'u', 's', 'strike'])

/** Mapa de la etiqueta de entrada a la que se escribe en el HTML final. */
const EQUIVALENTES_INLINE: Record<string, string> = {
  b: 'strong',
  i: 'em',
  strike: 's',
}

/** Se descartan junto con todo lo que tengan adentro. */
const ETIQUETAS_DESCARTADAS = new Set([
  'script',
  'style',
  'noscript',
  'iframe',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'option',
  'svg',
  'math',
  'link',
  'meta',
  'template',
  'canvas',
  'audio',
  'video',
  'source',
  'track',
  'map',
  'area',
])

/** Etiquetas que separan parrafos (su contenido se reparte en bloques). */
const ETIQUETAS_DE_BLOQUE = new Set([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'nav',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'dl',
  'dt',
  'dd',
  'pre',
  'address',
  'center',
  'fieldset',
  'legend',
  'details',
  'summary',
  'hgroup',
])

/** Un unico emoji (admite tono de piel, uniones ZWJ y selector de variacion). */
const SOLO_EMOJI = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Modifier}|\u200d|\ufe0f|\s)+$/u

/** Debe haber al menos un pictograma: los digitos sueltos tambien son "Emoji_Component". */
const TIENE_PICTOGRAMA = /\p{Extended_Pictographic}/u

function escaparTexto(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escaparAtributo(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Un parrafo con texto real (o con una imagen) y no solo etiquetas vacias. */
function tieneContenido(html: string): boolean {
  if (!html) {
    return false
  }
  if (/<img\b/i.test(html)) {
    return true
  }
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0
}

/** Saca las etiquetas de un HTML (para el respaldo en texto plano). */
function sinEtiquetas(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

/** Host de una URL absoluta, en minusculas (vacio si la URL no se puede leer). */
function hostDe(src: string): string {
  if (!/^https?:\/\//i.test(src.trim())) {
    return ''
  }
  try {
    return new URL(src.trim()).hostname.toLowerCase()
  } catch {
    return ''
  }
}

/** `true` si la imagen es una foto alojada en Facebook (esas URL caducan). */
export function esFotoDeFacebook(src: string): boolean {
  const host = hostDe(src)
  if (!host) {
    return false
  }
  return /(^|\.)fbcdn\.net$/.test(host) || /(^|\.)facebook\.com$/.test(host)
}

/**
 * `true` si la imagen es en realidad un emoji que Facebook (o cualquier editor
 * web) sirve como PNG de 16px dentro del texto.
 */
export function esImagenDeEmoji(imagen: HTMLImageElement): boolean {
  const src = (imagen.getAttribute('src') ?? '').trim()
  if (/emoji\.php|\/images\/emoji\//i.test(src)) {
    return true
  }

  const alt = (imagen.getAttribute('alt') ?? '').trim()
  if (!alt || !SOLO_EMOJI.test(alt) || !TIENE_PICTOGRAMA.test(alt)) {
    return false
  }

  const ancho = Number(imagen.getAttribute('width') ?? 0)
  const alto = Number(imagen.getAttribute('height') ?? 0)
  return (ancho > 0 || alto > 0) && ancho <= 32 && alto <= 32
}

/**
 * Recupera el emoji que representa una imagen: primero por su texto alternativo
 * (Facebook lo escribe ahi) y despues por los puntos de codigo del nombre del
 * archivo (`.../1f600.png`, `.../1f468-200d-1f469-200d-1f467.png`).
 */
export function emojiDesdeImagen(src: string, alt = ''): string {
  const texto = alt.trim()
  if (texto && SOLO_EMOJI.test(texto) && TIENE_PICTOGRAMA.test(texto) && texto.length <= 24) {
    return texto
  }

  const archivo = src.split(/[?#]/)[0].split('/').pop() ?? ''
  const codigos = archivo.replace(/\.[a-z0-9]+$/i, '').split(/[-_]/)
  if (codigos.length === 0 || !codigos.every((codigo) => /^[0-9a-f]{2,6}$/i.test(codigo))) {
    return ''
  }

  try {
    return codigos
      .map((codigo) => String.fromCodePoint(Number.parseInt(codigo, 16)))
      .join('')
  } catch {
    return ''
  }
}

/** Documento al que pertenece un nodo (para crear nodos de texto nuevos). */
function documentoDe(raiz: ParentNode): Document | null {
  if (raiz.nodeType === 9) {
    return raiz as Document
  }
  return (raiz as Element).ownerDocument
}

/**
 * Convierte en caracteres los emojis que llegaron como imagen.
 * Devuelve cuantos se pudieron recuperar; los que no, se eliminan.
 */
export function convertirEmojisDeFacebook(raiz: ParentNode): number {
  const doc = documentoDe(raiz)
  let convertidos = 0

  for (const imagen of Array.from(raiz.querySelectorAll('img'))) {
    if (!esImagenDeEmoji(imagen)) {
      continue
    }

    const emoji = emojiDesdeImagen(imagen.getAttribute('src') ?? '', imagen.getAttribute('alt') ?? '')
    if (emoji && doc) {
      imagen.replaceWith(doc.createTextNode(emoji))
      convertidos += 1
    } else {
      imagen.remove()
    }
  }

  return convertidos
}

/**
 * Elimina las fotos servidas por Facebook: sus enlaces estan firmados y caducan,
 * asi que a los pocos dias el visitante ve un icono roto.
 */
export function quitarFotosDeFacebook(raiz: ParentNode): number {
  let quitadas = 0

  for (const imagen of Array.from(raiz.querySelectorAll('img'))) {
    if (esImagenDeEmoji(imagen) || !esFotoDeFacebook(imagen.getAttribute('src') ?? '')) {
      continue
    }
    imagen.remove()
    quitadas += 1
  }

  return quitadas
}

/** Un bloque independiente del cuerpo de la noticia. */
type Bloque =
  | { tipo: 'parrafo'; html: string }
  | { tipo: 'titulo'; nivel: 2 | 3; html: string }
  | { tipo: 'cita'; html: string }
  | { tipo: 'lista'; ordenada: boolean; items: string[] }
  | { tipo: 'imagen'; html: string }
  | { tipo: 'linea' }

/** Contadores compartidos por todos los recolectores de un mismo pegado. */
interface Contadores {
  emojis: number
  fotosDescartadas: number
}

/**
 * Junta el contenido pegado en bloques.
 *
 * Mantiene un "parrafo en curso" como HTML en linea; cuando aparece un salto o
 * un bloque nuevo se cierra. Si habia formato abierto (negrita, un enlace) se
 * cierra antes de cortar y se vuelve a abrir en el parrafo siguiente, para que
 * nunca queden etiquetas desbalanceadas.
 */
class Recolector {
  private bloques: Bloque[] = []
  private actual = ''
  private abiertas: string[] = []

  constructor(readonly contadores: Contadores) {}

  agregar(html: string): void {
    this.actual += html
  }

  texto(valor: string): void {
    this.agregar(escaparTexto(valor.replace(/\u00a0/g, ' ')))
  }

  abrir(etiqueta: string): void {
    this.abiertas.push(etiqueta)
    this.agregar(`<${etiqueta}>`)
  }

  cerrar(etiqueta: string): void {
    const posicion = this.abiertas.lastIndexOf(etiqueta)
    if (posicion === -1) {
      return
    }
    while (this.abiertas.length > posicion) {
      const abierta = this.abiertas.pop()
      if (abierta) {
        this.agregar(`</${abierta}>`)
      }
    }
  }

  /** Cierra el parrafo en curso (salto de linea, cambio de bloque). */
  cortar(): void {
    const abiertas = this.abiertas.slice()
    for (const etiqueta of [...abiertas].reverse()) {
      this.agregar(`</${etiqueta}>`)
    }

    const html = this.actual.replace(/\s+/g, ' ').trim()
    this.actual = ''
    this.abiertas = []

    if (tieneContenido(html)) {
      this.bloques.push({ tipo: 'parrafo', html })
    }

    for (const etiqueta of abiertas) {
      this.abrir(etiqueta)
    }
  }

  /** Agrega un bloque propio y deja el parrafo en curso en blanco. */
  bloque(bloque: Bloque): void {
    this.cortar()
    this.actual = ''
    this.abiertas = []
    this.bloques.push(bloque)
  }

  imagen(html: string): void {
    this.bloque({ tipo: 'imagen', html })
  }

  lista(ordenada: boolean, items: string[]): void {
    this.bloque({ tipo: 'lista', ordenada, items })
  }

  resultado(): Bloque[] {
    this.cortar()
    return this.bloques
  }
}

/** Convierte un bloque en su HTML final. */
function bloqueAHtml(bloque: Bloque): string {
  switch (bloque.tipo) {
    case 'parrafo':
      return `<p>${bloque.html}</p>`
    case 'titulo':
      return `<h${bloque.nivel}>${bloque.html}</h${bloque.nivel}>`
    case 'cita':
      return `<blockquote>${bloque.html}</blockquote>`
    case 'lista':
      return `<${bloque.ordenada ? 'ol' : 'ul'}>${bloque.items
        .map((item) => `<li>${item}</li>`)
        .join('')}</${bloque.ordenada ? 'ol' : 'ul'}>`
    case 'imagen':
      return bloque.html
    case 'linea':
      return '<hr>'
  }
}

/** Bloque como HTML de una linea (los parrafos no llevan `<p>` en este caso). */
function htmlEnLinea(bloque: Bloque): string {
  return bloque.tipo === 'parrafo' ? bloque.html : bloqueAHtml(bloque)
}

/** Recorre un nodo y devuelve su contenido como HTML de una sola linea. */
function inlineDe(nodo: Node, recolector: Recolector): string {
  const sub = new Recolector(recolector.contadores)
  recorrer(nodo, sub)
  return sub
    .resultado()
    .map(htmlEnLinea)
    .join(' ')
    .trim()
}

function recolectarImagen(imagen: HTMLImageElement, recolector: Recolector): void {
  const src = (imagen.getAttribute('src') ?? '').trim()
  if (!src) {
    return
  }

  if (esImagenDeEmoji(imagen)) {
    const emoji = emojiDesdeImagen(src, imagen.getAttribute('alt') ?? '')
    if (emoji) {
      recolector.contadores.emojis += 1
      recolector.texto(emoji)
    } else {
      recolector.contadores.fotosDescartadas += 1
    }
    return
  }

  if (esFotoDeFacebook(src)) {
    recolector.contadores.fotosDescartadas += 1
    return
  }

  const alt = (imagen.getAttribute('alt') ?? '').trim()
  recolector.imagen(`<img src="${escaparAtributo(src)}" alt="${escaparAtributo(alt)}" />`)
}

function recolectarEnlace(enlace: HTMLAnchorElement, recolector: Recolector): void {
  const href = (enlace.getAttribute('href') ?? '').trim()
  const seguro = /^(?:https?:\/\/|mailto:|tel:|\/)/i.test(href) && !/^javascript:/i.test(href)

  if (!seguro) {
    recorrer(enlace, recolector)
    return
  }

  recolector.agregar(`<a href="${escaparAtributo(href)}">`)
  recorrer(enlace, recolector)
  recolector.agregar('</a>')
}

function recolectarLista(lista: HTMLElement, recolector: Recolector, ordenada: boolean): void {
  const items = Array.from(lista.children)
    .filter((hijo) => hijo.tagName.toLowerCase() === 'li')
    .map((item) => inlineDe(item, recolector))
    .filter((html) => tieneContenido(html))

  if (items.length === 0) {
    recolector.cortar()
    recorrer(lista, recolector)
    recolector.cortar()
    return
  }

  recolector.lista(ordenada, items)
}

/** Recorre el arbol pegado y lo va repartiendo en bloques del recolector. */
function recorrer(nodo: Node, recolector: Recolector): void {
  for (const hijo of Array.from(nodo.childNodes)) {
    if (hijo.nodeType === 3) {
      recolector.texto(hijo.nodeValue ?? '')
      continue
    }

    if (hijo.nodeType !== 1) {
      continue
    }

    const elemento = hijo as HTMLElement
    const etiqueta = elemento.tagName.toLowerCase()

    if (ETIQUETAS_DESCARTADAS.has(etiqueta)) {
      continue
    }

    if (etiqueta === 'br') {
      recolector.cortar()
      continue
    }

    if (etiqueta === 'hr') {
      recolector.bloque({ tipo: 'linea' })
      continue
    }

    if (etiqueta === 'img') {
      recolectarImagen(elemento as HTMLImageElement, recolector)
      continue
    }

    if (etiqueta === 'a') {
      recolectarEnlace(elemento as HTMLAnchorElement, recolector)
      continue
    }

    if (ETIQUETAS_INLINE.has(etiqueta)) {
      const salida = EQUIVALENTES_INLINE[etiqueta] ?? etiqueta
      recolector.abrir(salida)
      recorrer(elemento, recolector)
      recolector.cerrar(salida)
      continue
    }

    if (etiqueta === 'ul' || etiqueta === 'ol') {
      recolectarLista(elemento, recolector, etiqueta === 'ol')
      continue
    }

    if (/^h[1-6]$/.test(etiqueta)) {
      const nivel = Number(etiqueta.slice(1)) <= 2 ? 2 : 3
      recolector.bloque({ tipo: 'titulo', nivel, html: inlineDe(elemento, recolector) })
      continue
    }

    if (etiqueta === 'blockquote') {
      recolector.bloque({ tipo: 'cita', html: inlineDe(elemento, recolector) })
      continue
    }

    if (ETIQUETAS_DE_BLOQUE.has(etiqueta)) {
      // Cada caja (los `<div>` que pone Facebook por linea) cierra el parrafo.
      recolector.cortar()
      recorrer(elemento, recolector)
      recolector.cortar()
      continue
    }

    // Etiquetas desconocidas (`span`, `font`, `time`, web components...): se
    // recorren igual, conservando solo su texto y su formato conocido.
    recorrer(elemento, recolector)
  }
}

/** Respaldo cuando el portapapeles solo trae texto: una linea, un parrafo. */
function parrafosDeTexto(texto: string): string {
  return texto
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((bloque) =>
      bloque
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean)
        .map((linea) => escaparTexto(linea.replace(/\u00a0/g, ' ')))
        .join('<br>'),
    )
    .filter(Boolean)
    .map((bloque) => `<p>${bloque}</p>`)
    .join('')
}

/**
 * Limpia un HTML que ya estaba guardado en la base de datos: devuelve los
 * emojis-imagen a caracteres y quita las fotos de Facebook. Solo interviene si
 * encuentra algo que curar, para no alterar el resto del contenido.
 */
export function curarHtmlGuardado(html: string): string {
  const valor = html ?? ''

  if (!valor.trim() || typeof DOMParser === 'undefined' || !/<img\b/i.test(valor)) {
    return valor
  }

  const doc = new DOMParser().parseFromString(valor, 'text/html')
  const emojis = convertirEmojisDeFacebook(doc.body)
  const fotos = quitarFotosDeFacebook(doc.body)

  return emojis + fotos > 0 ? doc.body.innerHTML : valor
}

/**
 * Convierte lo copiado en el portapapeles en parrafos limpios para el editor.
 *
 * Prefiere el HTML (conserva negritas, enlaces y listas) y recurre al texto
 * plano cuando no hay HTML o cuando el HTML no deja nada usable.
 */
export function limpiarHtmlPegado(html: string, textoPlano = ''): ResultadoPegado {
  const fuente = (html ?? '').trim()
  const respaldo = () => ({ html: parrafosDeTexto(textoPlano), emojis: 0, fotosDescartadas: 0 })

  if (!fuente) {
    return respaldo()
  }

  // Sin DOM (SSR, pruebas en Node) no se puede interpretar el HTML.
  if (typeof DOMParser === 'undefined') {
    return { html: parrafosDeTexto(sinEtiquetas(fuente) || textoPlano), emojis: 0, fotosDescartadas: 0 }
  }

  const doc = new DOMParser().parseFromString(fuente, 'text/html')
  const contadores: Contadores = { emojis: 0, fotosDescartadas: 0 }
  const recolector = new Recolector(contadores)

  recorrer(doc.body, recolector)

  const limpio = recolector
    .resultado()
    .map(bloqueAHtml)
    .join('')
    .trim()

  return {
    html: limpio || parrafosDeTexto(textoPlano),
    emojis: contadores.emojis,
    fotosDescartadas: contadores.fotosDescartadas,
  }
}

