/**
 * Saneador de HTML para el cuerpo de las noticias.
 *
 * El contenido de una noticia se edita con un editor enriquecido y se guarda
 * como HTML. Aunque lo escriben usuarios con permisos del panel, ese HTML viaja
 * por el servidor y se muestra a todos los visitantes, asi que antes de
 * pintarlo se limpia: solo se permiten etiquetas y atributos seguros y se
 * elimina cualquier script, estilo o manejador de eventos.
 */

/** Etiquetas que se mantienen tal cual (sin atributos salvo los permitidos). */
const ETIQUETAS_PERMITIDAS = new Set([
  'p',
  'br',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'img',
  'figure',
  'figcaption',
  'hr',
  'span',
  'div',
])

/** Se eliminan por completo, junto con todo su contenido. */
const ETIQUETAS_PELIGROSAS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'svg',
  'math',
])

const ATRIBUTOS_PERMITIDOS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
}

/** Acepta URLs http(s), rutas internas, anclas, data:image y mailto/tel. */
function esUrlSegura(valor: string): boolean {
  const limpio = valor.trim()
  if (!limpio) {
    return false
  }

  if (/^(?:https?:|mailto:|tel:)/i.test(limpio)) {
    return true
  }

  if (limpio.startsWith('/') || limpio.startsWith('#') || limpio.startsWith('.')) {
    return true
  }

  return /^data:image\//i.test(limpio)
}

function sanearNodo(nodo: Node): void {
  const hijos = Array.from(nodo.childNodes)

  for (const hijo of hijos) {
    if (hijo.nodeType === Node.COMMENT_NODE) {
      hijo.remove()
      continue
    }

    if (hijo.nodeType !== Node.ELEMENT_NODE) {
      continue
    }

    const el = hijo as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (ETIQUETAS_PELIGROSAS.has(tag)) {
      el.remove()
      continue
    }

    // Limpia primero los descendientes, asi al desenvolver una etiqueta no
    // permitida su contenido ya viene saneado.
    sanearNodo(el)

    if (!ETIQUETAS_PERMITIDAS.has(tag)) {
      const parent = el.parentNode
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el)
        }
        parent.removeChild(el)
      }
      continue
    }

    const permitidos = ATRIBUTOS_PERMITIDOS[tag]

    for (const atributo of Array.from(el.attributes)) {
      const nombre = atributo.name.toLowerCase()

      if (!permitidos || !permitidos.has(nombre)) {
        el.removeAttribute(atributo.name)
        continue
      }

      if ((nombre === 'href' || nombre === 'src') && !esUrlSegura(atributo.value)) {
        el.removeAttribute(atributo.name)
      }
    }

    if (tag === 'img' && !el.getAttribute('src')) {
      el.remove()
      continue
    }

    if (tag === 'a') {
      el.setAttribute('rel', 'noopener noreferrer')
      const target = el.getAttribute('target')
      if (target && target !== '_blank' && target !== '_self') {
        el.removeAttribute('target')
      }
    }
  }
}

/**
 * Devuelve el HTML saneado. En un entorno sin DOM (SSR) devuelve el valor tal cual.
 */
export function sanitizeHtml(html: string): string {
  const valor = html ?? ''

  if (!valor.trim() || typeof window === 'undefined') {
    return valor
  }

  const doc = new DOMParser().parseFromString(valor, 'text/html')
  sanearNodo(doc.body)

  return doc.body.innerHTML
}
