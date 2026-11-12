/**
 * Traduce publicaciones de la pagina de Facebook del club a entradas del
 * manifiesto de `importar/`.
 *
 * Facebook no deja leer la pagina sin sesion (responde 400 a cualquier programa,
 * y los enlaces de sus fotos caducan y dan 403), pero un administrador de la
 * pagina si puede sacar un *token de pagina* y consultar la Graph API. Esto es
 * la parte sin red de `scripts/sincronizar-facebook.ts`: recibe el JSON que
 * devuelve la API y arma los borradores, para poder probarlos sin token.
 *
 * Las categorias son las mismas que ofrece el panel (`NoticiasManager.tsx`).
 */

import { esFechaValida, type EntradaGaleria, type EntradaNoticia } from './importar.js';

/** Publicacion tal como la devuelve `/{pagina}/posts` de la Graph API. */
export interface PublicacionFacebook {
  id?: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  attachments?: {
    data?: Array<{
      media?: { image?: { src?: string } };
      subattachments?: { data?: Array<{ media?: { image?: { src?: string } } }> };
    }>;
  };
}

export interface OpcionesMapeo {
  /** Archivos locales ya descargados, en el mismo orden que `fotosDePublicacion`. */
  archivos: string[];
  /** Id de la noticia que ya esta en el sitio, para actualizarla en vez de crear otra. */
  id?: number;
  /** Categoria del borrador; si no se indica se adivina por el texto. */
  categoria?: string;
  /** Categoria de las fotos que van a la galeria (por defecto `Partidos`). */
  categoriaGaleria?: string;
}

export interface ResultadoMapeo {
  noticia?: EntradaNoticia;
  galeria: EntradaGaleria[];
  /** Por que no se pudo usar la publicacion; vacio si se uso. */
  motivo?: string;
}

export const CATEGORIAS = [
  'Resultados',
  'Fichajes',
  'Fixtures',
  'Instalaciones',
  'Lesiones',
  'Institucional',
] as const;

export const CATEGORIA_POR_DEFECTO = 'Institucional';
export const CATEGORIA_GALERIA_POR_DEFECTO = 'Partidos';

const MAX_TITULO = 90;
const MAX_EXTRACTO = 220;

/** Enlaces, hashtags y menciones no aportan nada en un titular. */
const RUIDO = /(https?:\/\/\S+|(^|\s)[#@][\p{L}\p{N}_]+)/gu;
const EMOJI = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;

/**
 * Categorias por palabra clave, de la mas especifica a la mas general.
 * Es una adivinanza: se puede corregir en `noticias.json` o en el panel antes
 * de publicar.
 */
const REGLAS_CATEGORIA: Array<[string, RegExp]> = [
  ['Fichajes', /\b(bienvenid[oa]s?|refuerzos?|fichajes?|incorpora\w*|renov\w+|nuevos? jugador(es)?|plantel)\b/iu],
  ['Resultados', /\b(victoria|triunfo|derrota|empate|goles?|marcador|vs\.?|fecha \d+|ganamos|gan[oó]|cay[oó])\b/iu],
  ['Lesiones', /\b(lesi[oó]n\w*|lesionad[oa]s?|operaci[oó]n|recuperaci[oó]n|kinesi\w+)\b/iu],
  ['Fixtures', /\b(programaci[oó]n|fixture|pr[oó]ximo partido|horario|s[áa]bado|domingo|local[ií]a)\b/iu],
  ['Instalaciones', /\b(cancha|sede|instalacion\w*|camarines|iluminaci[oó]n|obras?|trabajos|piscina)\b/iu],
];

/** Extension a partir del enlace de la foto (Facebook casi siempre sirve JPEG). */
function extensionDeUrl(url: string): string {
  const encontrado = /\.(jpe?g|png|webp|gif)(?:[?#]|$)/i.exec(url);
  return encontrado ? encontrado[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

function recortar(texto: string, maximo: number): string {
  if (texto.length <= maximo) {
    return texto;
  }

  const corte = texto.slice(0, maximo);
  const espacio = corte.lastIndexOf(' ');

  return (espacio > maximo * 0.6 ? corte.slice(0, espacio) : corte).replace(/[\s,;:.\-–—]+$/, '');
}

/** Quita enlaces, hashtags, emojis y espacios de sobra de una linea. */
function limpiar(texto: string): string {
  return texto
    .replace(RUIDO, ' ')
    .replace(EMOJI, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Separa la primera linea (el titular que suele escribir el club) del resto. */
export function separarMensaje(mensaje: string | undefined): { titulo: string; cuerpo: string } {
  const lineas = String(mensaje ?? '').split(/\r?\n/);
  const inicio = lineas.findIndex((linea) => linea.trim() !== '');

  if (inicio === -1) {
    return { titulo: '', cuerpo: '' };
  }

  return {
    titulo: lineas[inicio].trim(),
    cuerpo: lineas.slice(inicio + 1).join('\n').trim(),
  };
}

/**
 * Titular de la publicacion: la primera linea con texto util, sin hashtags ni
 * enlaces, recortada a `maximo` caracteres.
 */
export function tituloDeMensaje(mensaje: string | undefined, maximo = MAX_TITULO): string {
  const lineas = String(mensaje ?? '')
    .split(/\r?\n/)
    .map((linea) => limpiar(linea))
    .filter((linea) => linea.length >= 3);

  const primera = lineas[0];

  if (!primera) {
    return '';
  }

  const titulo = recortar(primera, maximo);

  return titulo.charAt(0).toUpperCase() + titulo.slice(1);
}

/** Primer parrafo del cuerpo, para la portada. */
export function extractoDeMensaje(mensaje: string | undefined, maximo = MAX_EXTRACTO): string {
  const { cuerpo } = separarMensaje(mensaje);
  const parrafo = cuerpo.split(/\n\s*\n/)[0] ?? '';
  const texto = limpiar(parrafo.replace(/\r?\n/g, ' '));

  return recortar(texto, maximo);
}

/** Cuerpo completo como HTML simple, que es lo que espera el editor del panel. */
export function contenidoDeMensaje(mensaje: string | undefined): string {
  const { cuerpo } = separarMensaje(mensaje);

  return cuerpo
    .split(/\n\s*\n/)
    .map((bloque) => limpiar(bloque.replace(/\r?\n/g, ' ')))
    .filter(Boolean)
    .map((bloque) => `<p>${escaparHtml(bloque)}</p>`)
    .join('');
}

/** Categoria probable segun el texto; la de por defecto si no calza ninguna. */
export function categoriaDeMensaje(mensaje: string | undefined): string {
  const texto = String(mensaje ?? '');

  for (const [categoria, patron] of REGLAS_CATEGORIA) {
    if (patron.test(texto)) {
      return categoria;
    }
  }

  return CATEGORIA_POR_DEFECTO;
}

/**
 * Fecha del sitio (`AAAA-MM-DD`) en hora de Chile: una publicacion de las 22:00
 * del dia 10 sigue siendo del 10, no del 11 como diria la fecha en UTC.
 */
export function fechaDePublicacion(createdTime: string | undefined): string {
  if (!createdTime) {
    return '';
  }

  const fecha = new Date(createdTime);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  // `en-CA` formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}


/** Todas las fotos de la publicacion, sin repetir (la portada primero). */
export function fotosDePublicacion(publicacion: PublicacionFacebook): string[] {
  const urls: string[] = [];

  const agregar = (url: string | undefined): void => {
    if (url && /^https?:\/\//i.test(url) && !urls.includes(url)) {
      urls.push(url);
    }
  };

  agregar(publicacion.full_picture);

  for (const adjunto of publicacion.attachments?.data ?? []) {
    agregar(adjunto.media?.image?.src);

    for (const sub of adjunto.subattachments?.data ?? []) {
      agregar(sub.media?.image?.src);
    }
  }

  return urls;
}

/**
 * Nombre del archivo local para la foto `indice` (1 en adelante) de una
 * publicacion. Es estable entre pasadas: si la foto no cambio se reutiliza el
 * archivo y el importador no la vuelve a subir.
 */
export function nombreDeArchivo(
  idPublicacion: string | undefined,
  indice: number,
  url: string,
): string {
  const base =
    String(idPublicacion ?? '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'publicacion';

  return `fb-${base}-${indice}.${extensionDeUrl(url)}`;
}

/**
 * Arma el borrador de noticia (y las fotos extra para la galeria) de una
 * publicacion. Una publicacion sin texto propio, o sea solo fotos, va entera a
 * la galeria.
 */
export function mapearPublicacion(
  publicacion: PublicacionFacebook,
  opciones: OpcionesMapeo,
): ResultadoMapeo {
  const fecha = fechaDePublicacion(publicacion?.created_time);

  if (!esFechaValida(fecha)) {
    return { galeria: [], motivo: `fecha invalida ("${publicacion?.created_time ?? ''}")` };
  }

  const archivos = (opciones.archivos ?? []).filter((archivo) => Boolean(archivo?.trim()));

  if (archivos.length === 0) {
    return { galeria: [], motivo: 'sin fotos' };
  }

  const categoriaGaleria = (opciones.categoriaGaleria ?? '').trim() || CATEGORIA_GALERIA_POR_DEFECTO;
  const titulo = tituloDeMensaje(publicacion?.message);

  if (!titulo) {
    return {
      galeria: archivos.map((archivo) => ({ archivo, fecha, categoria: categoriaGaleria })),
    };
  }

  const noticia: EntradaNoticia = {
    titulo,
    imagen: archivos[0],
    fecha,
    categoria: (opciones.categoria ?? '').trim() || categoriaDeMensaje(publicacion?.message),
  };

  const extracto = extractoDeMensaje(publicacion?.message);
  const contenido = contenidoDeMensaje(publicacion?.message);

  if (extracto) {
    noticia.extracto = extracto;
  }

  if (contenido) {
    noticia.contenido = contenido;
  }

  const id = Number(opciones.id);

  if (Number.isFinite(id) && id > 0) {
    noticia.id = id;
  }

  // De la segunda foto en adelante no se pierden: van a la galeria.
  return {
    noticia,
    galeria: archivos
      .slice(1)
      .map((archivo) => ({ archivo, fecha, categoria: categoriaGaleria })),
  };
}

